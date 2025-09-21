let isRunning = false;

let usedRadioIndices = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start") {
    isRunning = true;
    getSchedules();
  } else if (request.action === "stop") {
    isRunning = false;
  } else if (request.action === "status") {
    sendResponse({isRunning});
  }
});

async function getSchedules() {
  try {
    await openSchedule();
    while (isRunning) {
      await waitForLoadingFinish();
      if (!isRunning) break;
      if (await selectSchedule()) break;
      if (!isRunning) break;
      if (await handleModal()) {
        await openSchedule();
      } else {
        await new Promise((resolve) => {
          if (!isRunning) resolve();
          else setTimeout(resolve, 100);
        });
      }
    }
  } catch (error) {
    console.warn("Error in getSchedules:", error);
  }
}

function checkElement(selector) {
  const el = document.querySelector(selector);

  return {
    exists: el && el.offsetParent !== null,
    // exists: el ? !!el?.offsetParent : false,
    element: el,
  };
}

async function waitForElement(selector, interval = 100) {
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      if (!isRunning) {
        clearInterval(timer);
        reject("Operation cancelled");
      }
      const {element, exists} = checkElement(selector);
      if (exists && element) {
        clearInterval(timer);
        resolve(element);
      }
    }, interval);
  });
}

async function waitForLoadingFinish() {
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      const {exists} = checkElement(".nprogress-busy");
      if (!exists) {
        clearInterval(timer);
        resolve();
      }
    }, 100);
  });
}

async function openSchedule() {
  const button = await waitForElement("button[data-i18n='tms:getSchedules']");
  button.dispatchEvent(new MouseEvent("click", {bubbles: true}));
}

async function handleModal(wait = false, timeout = 500) {
  async function closeModal() {
    const closeModalButton = await waitForElement("#modelcloseicon");
    closeModalButton.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    // for confirmation
    closeModalButton.click();
    await new Promise((resolve) => setTimeout(resolve, 200));
    return true;
  }

  if (wait) {
    const modalElement = await waitForElement(".modal-content");
    const modalText = modalElement.textContent;
    if (modalText.includes("تم إرسال طلبات المواعيد التالية بنجاح")) {
      return false;
    } else if (modalText.includes("لقد نفذت المواعيد")) {
      await closeModal();
      return "no_appointments"; // New case: no appointments available
    } else {
      return await closeModal();
    }
  } else {
    const {exists: modalExists} = checkElement(".modal-content");
    if (modalExists) {
      return await closeModal();
    }
    return false;
  }
}

async function selectSchedule() {
  const {element: scheduleElement, exists: scheduleExists} = checkElement(
    ".tab-pane.active td.day:not(.disabled)[data-action='selectDay']"
  );

  if (scheduleExists) {
    scheduleElement.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    await selectRandomRadio();
    return true;
  }
  return false;
}

async function selectRandomRadio(
  selector = "form[i18n-title='broker:create_appointment:appointment_datails'] input[type='radio']"
) {
  await waitForElement(selector);

  const radios = Array.from(document.querySelectorAll(selector));
  if (radios.length === 0) return;

  // Filter out used indices
  const availableIndices = radios
    .map((_, index) => index)
    .filter((index) => !usedRadioIndices.includes(index));

  if (availableIndices.length === 0) {
    alert("كل المواعيد تم استخدامها");
    return false;
  }

  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  usedRadioIndices.push(randomIndex); // Track selected index
  const randomRadio = radios[randomIndex];

  randomRadio.checked = true;
  randomRadio.dispatchEvent(new Event("change"));

  const isValid = goToNext();

  if (isValid) {
    await submit();
  }

  return true;
}

function goToNext() {
  const {element: nextButton, exists} = checkElement('button[data-i18n="nextButtonText"]');

  if (exists) {
    nextButton.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    return true;
  }
  return false;
}

function goToBack() {
  const {element: backButton, exists} = checkElement('button[data-i18n="previous"]');

  if (exists) {
    backButton.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    return true;
  }
  return false;
}

async function submit() {
  await waitForElement(".tab-pane.wizard-step.active #mutliAdded");

  const submitElement = await waitForElement("#broker button[data-i18n='submitButtonText']");

  if (submitElement) {
    submitElement.dispatchEvent(new MouseEvent("click", {bubbles: true}));

    await waitForLoadingFinish();

    const isModal = await handleModal(true);
    if (isModal === "no_appointments") {
      const isValid = goToBack();
      if (isValid) {
        await selectRandomRadio();
      }
    } else if (isModal === true) {
      await submit();
    }
  }
}
