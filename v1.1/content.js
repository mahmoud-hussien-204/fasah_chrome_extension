chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start") {
    getSchedules();
  }
});

function checkElement(selector) {
  const el = document.querySelector(selector);
  return {
    exists: !!el,
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

async function getSchedules() {
  const button = await waitForElement("button[data-i18n='tms:getSchedules']");

  button.dispatchEvent(new MouseEvent("click", {bubbles: true}));

  let retries = true;
  while (retries) {
    await waitForLoadingFinish();
    const {element: finalScheduleElement, exists: finalScheduleExists} = checkElement(
      "#finalSchedule td.day:not(.disabled)[data-action='selectDay']"
    );

    if (finalScheduleExists && finalScheduleElement.offsetParent) {
      retries = false;
      finalScheduleElement.dispatchEvent(new MouseEvent("click", {bubbles: true}));
      await selectRandomRadio();
    } else {
      await waitForElement(".modal-content");
      const closeModalButton = await waitForElement("#modelcloseicon");
      closeModalButton.dispatchEvent(new MouseEvent("click", {bubbles: true}));
      await new Promise((resolve) => setTimeout(resolve, 500));
      button.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    }
  }
}

async function selectRandomRadio(
  selector = "form[i18n-title='broker:create_appointment:appointment_datails'] table input[type='radio']"
) {
  await waitForElement(selector);
  const radios = Array.from(document.querySelectorAll(selector));
  if (radios.length === 0) return;

  const randomIndex = Math.floor(Math.random() * radios.length);
  const randomRadio = radios[randomIndex];

  randomRadio.checked = true;
  randomRadio.dispatchEvent(new Event("change"));

  console.log("selected radio", randomRadio);

  const isValid = goToNext();

  if (isValid) {
    await submit();
  }
}

function goToNext() {
  const {element: nextButton, exists} = checkElement('button[data-i18n="nextButtonText"]');
  console.log({exists, nextButton});

  if (exists) {
    nextButton.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    return true;
  }
  return false;
}

async function submit() {
  console.log("submitting");
  const submitElement = await waitForElement(
    'form[i18n-title="broker:create_appointment:carrier_and_shipment_information"] button[data-i18n="submitButtonText"]'
  );
  console.log("submitting", submitElement);
  if (submitElement.offsetParent) {
    submitElement.dispatchEvent(new MouseEvent("click", {bubbles: true}));
  }
}
