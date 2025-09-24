import { dom, selectors, WAITING_LOADING_TIMEOUT } from './shared/utils/dom.util';

let isRunning = false;

let usedRadioIndices: number[] = [];

let sendResponseFn: ((response: any) => void) | null = null;

const messages = {
  submittedSuccessfully: 'تم إرسال طلبات المواعيد التالية بنجاح',
  noAppointmentsLeft: 'لقد نفذت المواعيد',
  cannotSubmit: 'لا استطيع تقديم الطلب',
  submitting: 'جاري تقديم الطلب',
  cannotGoNext: 'لا استطيع الذهاب للخطوة التالية',
  chooseAnotherAppointment: 'الان سنختار موعد اخر',
};

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  sendResponseFn = sendResponse;
  switch (request.action) {
    case 'status': {
      sendResponse({ status: isRunning });
      break;
    }
    case 'start': {
      isRunning = true;
      getSchedules();
      break;
    }
    case 'stop': {
      isRunning = false;
      break;
    }
  }

  sendResponse({ reply: 'Message received by content script!' });
  return true;
});

async function getSchedules() {
  try {
    await openSchedule();
    while (isRunning) {
      await waitForLoadingFinish();
      if (!isRunning) break;
      const isScheduleSelected = await selectSchedule();
      if (isScheduleSelected) {
        const isNextStep = goToNextStep();
        if (isNextStep) {
          await submitForm();
          break;
        }

        sendResponseFn?.({ message: messages.cannotGoNext });
        break;
      }
      if (!isRunning) break;
      if (await closeModal()) {
        await openSchedule();
      } else {
        await new Promise((resolve) => {
          if (!isRunning) resolve(true);
          else setTimeout(resolve, 100);
        });
      }
    }
  } catch (error) {
    console.warn('Error in getSchedules:', error);
  }
}

async function openSchedule() {
  const button = await dom.waitForElement(selectors.scheduleButton, undefined, isRunning);
  dom.triggerClickElement(button);
}

async function waitForLoadingFinish() {
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      const { exists } = dom.checkElement(selectors.loading);
      if (!exists) {
        clearInterval(timer);
        resolve(true);
      }
    }, WAITING_LOADING_TIMEOUT);
  });
}

async function selectSchedule() {
  const { element, exists } = dom.checkElement(selectors.dayCell);

  if (exists && element) {
    dom.triggerClickElement(element);
    return await selectRandomAppointment();
  }
  return false;
}

async function selectRandomAppointment(selector = selectors.appointment) {
  await dom.waitForElement(selector, undefined, isRunning);

  const radios = Array.from(document.querySelectorAll(selector));

  if (radios.length === 0) {
    sendResponseFn?.({ message: 'لا يوجد مواعيد متاحة' });
    return false;
  }

  // Filter out used indices
  const availableIndices = radios
    .map((_, index) => index)
    .filter((index) => !usedRadioIndices.includes(index));

  if (availableIndices.length === 0) {
    alert('كل المواعيد تم استخدامها');
    return false;
  }

  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  usedRadioIndices.push(randomIndex);
  const randomRadio = radios[randomIndex] as HTMLInputElement;

  sendResponseFn?.({ message: 'تم اختيار هذا الموعد', value: randomRadio.value });

  dom.triggerChangeEventElement(randomRadio);

  return true;
}

function goToNextStep() {
  const { element, exists } = dom.checkElement(selectors.nextButton);
  if (exists && element) {
    dom.triggerClickElement(element);
    return true;
  }
  return false;
}

function goToBackStep() {
  const { element, exists } = dom.checkElement(selectors.backButton);
  if (exists && element) {
    dom.triggerClickElement(element);
    return true;
  }
  return false;
}

async function closeModal(wait = false): Promise<boolean | 'no_appointments'> {
  if (wait) {
    const modalElement = await dom.waitForElement(selectors.modalContent, undefined, isRunning);
    const modalText = modalElement.textContent;
    if (modalText.includes(messages.submittedSuccessfully)) {
      return false;
    } else if (modalText.includes(messages.noAppointmentsLeft)) {
      const isClosedModal = await dom.closeModal(isRunning);
      if (isClosedModal) return 'no_appointments';
      return false;
    } else {
      return await dom.closeModal(isRunning);
    }
  } else {
    const { exists } = dom.checkElement(selectors.modalContent);
    if (exists) {
      return await dom.closeModal(isRunning);
    }
    return false;
  }
}

async function submitForm() {
  await dom.waitForElement(selectors.submitForm, undefined, isRunning);

  const submitElement = await dom.waitForElement(selectors.submitButton, undefined, isRunning);

  if (submitElement) {
    sendResponseFn?.({ message: messages.submitting });
    dom.triggerClickElement(submitElement);
    await waitForLoadingFinish();
    const modalStatus = await closeModal(true);
    if (modalStatus === 'no_appointments') {
      sendResponseFn?.({ message: messages.chooseAnotherAppointment });
      const isBackStep = goToBackStep();
      if (isBackStep) {
        const isSelectedAppointMent = await selectRandomAppointment();
        if (isSelectedAppointMent) {
          const isNextStep = goToNextStep();
          if (isNextStep) {
            await submitForm();
          } else {
            sendResponseFn?.({ message: messages.cannotGoNext });
          }
        }
      }
    } else if (modalStatus === true) {
      await submitForm();
    }
  } else {
    sendResponseFn?.({ message: messages.cannotSubmit });
  }
}
