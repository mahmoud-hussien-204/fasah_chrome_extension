chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start") {
    // getSchedules();
    submit();
  }
});

function checkElement(selector) {
  const el = document.querySelector(selector);

  return {
    exists: el && el.offsetParent !== null,
    // exists: el ? !!el?.offsetParent : false,
    element: el,
  };
}

async function waitForElement(selector, interval = 250) {
  return new Promise((resolve) => {
    const timer = setInterval(() => {
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

async function handleModal(wait = false) {
  async function closeModal() {
    const closeModalButton = await waitForElement("#modelcloseicon");
    closeModalButton.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    // for confirmation
    closeModalButton.click();
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  }

  if (wait) {
    await waitForElement(".modal-content");
    return await closeModal();
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

  console.log("scheduleElement", scheduleElement);

  if (scheduleExists) {
    scheduleElement.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    await selectRandomRadio();
    return true;
  }
  return false;
}

async function getSchedules() {
  try {
    await openSchedule();
    while (true) {
      await waitForLoadingFinish();
      if (await selectSchedule()) break;
      if (await handleModal()) {
        await openSchedule();
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    console.error("Error in getSchedules:", error);
  }
}

async function selectRandomRadio(
  selector = "form[i18n-title='broker:create_appointment:appointment_datails'] input[type='radio']"
) {
  console.log("radios selector", selector);

  await waitForElement(selector);

  const radios = Array.from(document.querySelectorAll(selector));
  if (radios.length === 0) return;

  const randomIndex = Math.floor(Math.random() * radios.length);
  const randomRadio = radios[randomIndex];

  randomRadio.checked = true;
  randomRadio.dispatchEvent(new Event("change"));

  console.log("all radios", {radios, randomRadio, randomIndex});

  // console.log("selected radio", randomRadio);

  const isValid = goToNext();

  if (isValid) {
    await submit();
  }
}

function goToNext() {
  const {element: nextButton, exists} = checkElement('button[data-i18n="nextButtonText"]');
  console.log("nextButton", nextButton, exists);

  if (exists) {
    nextButton.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    return true;
  }
  return false;
}

async function submit() {
  // console.log("submitting...");

  await waitForElement(".tab-pane.wizard-step.active #mutliAdded");

  // console.log("formElementWizard", formElementWizard);

  const submitElement = await waitForElement("#broker button[data-i18n='submitButtonText']");

  // console.log("submitted", submitElement);

  if (submitElement) {
    submitElement.dispatchEvent(new MouseEvent("click", {bubbles: true}));

    await waitForLoadingFinish();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // console.log("loading finished....");

    const isModal = await handleModal(true);

    console.log("isModal", isModal);

    if (isModal) {
      await submit();
    }
  }
}
