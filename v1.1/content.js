chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start") {
    getSchedules();
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
  console.log("opening schedule");

  const button = await waitForElement("button[data-i18n='tms:getSchedules']");
  console.log(button);

  button.dispatchEvent(new MouseEvent("click", {bubbles: true}));
}

async function handleModal() {
  const {exists: modalExists} = checkElement(".modal-content");
  if (modalExists) {
    const closeModalButton = await waitForElement("#modelcloseicon");
    closeModalButton.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  }
  return false;
}

async function selectSchedule() {
  const {element: scheduleElement, exists: scheduleExists} = checkElement(
    "#finalSchedule td.day:not(.disabled)[data-action='selectDay']"
  );
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

// async function getSchedules() {
//   const button = await waitForElement("button[data-i18n='tms:getSchedules']");

//   button.dispatchEvent(new MouseEvent("click", {bubbles: true}));

//   let retries = true;
//   while (retries) {
//     await waitForLoadingFinish();
//     const {element: finalScheduleElement, exists: finalScheduleExists} = checkElement(
//       "#finalSchedule td.day:not(.disabled)[data-action='selectDay']"
//     );

//     const {element: modalElement, exists: modalExists} = checkElement(".modal-content");

//     console.log(
//       "finalScheduleExists",
//       finalScheduleExists,
//       finalScheduleElement,
//       modalElement,
//       modalExists
//     );

//     if (finalScheduleExists) {
//       retries = false;
//       finalScheduleElement.dispatchEvent(new MouseEvent("click", {bubbles: true}));
//       await selectRandomRadio();
//     } else if (modalExists) {
//       const closeModalButton = await waitForElement("#modelcloseicon");
//       closeModalButton.dispatchEvent(new MouseEvent("click", {bubbles: true}));
//       await new Promise((resolve) => setTimeout(resolve, 500));
//       button.dispatchEvent(new MouseEvent("click", {bubbles: true}));
//     } else {
//       await new Promise((resolve) => setTimeout(resolve, 100));
//     }
//   }
// }

async function selectRandomRadio(
  selector = "form[i18n-title='broker:create_appointment:appointment_datails'] .fd-datepicker input[type='radio']"
) {
  // console.log("radios selector");

  const element = await waitForElement(selector);
  // console.log("radios aferr", element);

  const radios = Array.from(document.querySelectorAll(selector));
  if (radios.length === 0) return;

  const randomIndex = Math.floor(Math.random() * radios.length);
  const randomRadio = radios[randomIndex];

  randomRadio.checked = true;
  randomRadio.dispatchEvent(new Event("change"));

  // console.log("selected radio", randomRadio);

  const isValid = goToNext();

  if (isValid) {
    await submit();
  }
}

function goToNext() {
  const {element: nextButton, exists} = checkElement('button[data-i18n="nextButtonText"]');
  if (exists) {
    nextButton.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    return true;
  }
  return false;
}

async function submit() {
  // console.log("submitting...");

  const formElementWizard = await waitForElement(".tab-pane.wizard-step:nth-child(2).active");

  // console.log("formElementWizard", formElementWizard);

  const submitElement = await waitForElement(
    "#broker > div > div > div.d-flex.wizard-action-buttons > div:nth-child(5) > button"
  );

  // console.log("submitted", submitElement.offsetParent);

  if (submitElement) {
    submitElement.dispatchEvent(new MouseEvent("click", {bubbles: true}));
  }
}
