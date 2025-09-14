let isRunning = false;

let usedRadioIndices = [];

// Polite mode constants and state
const MIN_IDLE_MS = 300;
const MAX_IDLE_MS = 5000;
const BACKOFF_FACTOR = 1.6;
const JITTER_RATIO = 0.2; // ±20%
const SUBMIT_MAX_RETRIES = 3;
const SUBMIT_COOLDOWN_BASE_MS = 800;

let idleDelayMs = MIN_IDLE_MS;

function resetPoliteState() {
  idleDelayMs = MIN_IDLE_MS;
}

function withJitter(ms) {
  const delta = ms * JITTER_RATIO;
  const min = Math.max(0, ms - delta);
  const max = ms + delta;
  return Math.floor(min + Math.random() * (max - min));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start") {
    if (isRunning) return; // prevent overlapping loops
    isRunning = true;
    usedRadioIndices = [];
    resetPoliteState();
    getSchedules();
  } else if (request.action === "stop") {
    isRunning = false;
    usedRadioIndices = [];
    resetPoliteState();
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
      if (await selectSchedule()) {
        resetPoliteState();
        break;
      }
      if (!isRunning) break;
      if (await handleModal()) {
        await openSchedule();
        idleDelayMs = Math.min(Math.floor(idleDelayMs * BACKOFF_FACTOR), MAX_IDLE_MS);
      } else {
        await sleep(withJitter(idleDelayMs));
        idleDelayMs = Math.min(Math.floor(idleDelayMs * BACKOFF_FACTOR), MAX_IDLE_MS);
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
    console.log("handle modal", modalText);

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
  console.log("day element");

  const {element: scheduleElement, exists: scheduleExists} = checkElement(
    ".tab-pane.active td.day:not(.disabled)[data-action='selectDay']"
  );

  console.log("is day element", scheduleElement, scheduleExists);

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
  console.log("selectRandomRadio", selector);

  await waitForElement(selector);

  const radios = Array.from(document.querySelectorAll(selector));
  if (radios.length === 0) return;

  // Filter out used indices
  const availableIndices = radios
    .map((_, index) => index)
    .filter((index) => !usedRadioIndices.includes(index));

  console.log("availableIndices", {availableIndices, usedRadioIndices});

  if (availableIndices.length === 0) {
    alert("كل المواعيد تم استخدامها");
    return false;
  }

  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  usedRadioIndices.push(randomIndex); // Track selected index
  const randomRadio = radios[randomIndex];

  console.log("selected random radio", {randomIndex, randomRadio});

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
  console.log("backButton");
  const {element: backButton, exists} = checkElement('button[data-i18n="previous"]');
  console.log("backButton", {backButton, exists});

  if (exists) {
    backButton.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    return true;
  }
  return false;
}

async function submit() {
  await waitForElement(".tab-pane.wizard-step.active #mutliAdded");

  const submitElement = await waitForElement("#broker button[data-i18n='submitButtonText']");

  if (!submitElement) return;

  let attempt = 0;
  while (isRunning && attempt < SUBMIT_MAX_RETRIES) {
    submitElement.dispatchEvent(new MouseEvent("click", {bubbles: true}));

    await waitForLoadingFinish();

    const modalResult = await handleModal(true);
    if (modalResult === "no_appointments") {
      const isValid = goToBack();
      console.log("go to back and select random radio", isValid);
      if (isValid) {
        await selectRandomRadio();
      }
      return; // stop retrying this submit path
    }

    if (modalResult === false) {
      // Success modal path handled: nothing to retry
      return;
    }

    attempt++;
    if (attempt < SUBMIT_MAX_RETRIES) {
      const cooldown = Math.min(
        MAX_IDLE_MS,
        Math.floor(SUBMIT_COOLDOWN_BASE_MS * Math.pow(BACKOFF_FACTOR, attempt - 1))
      );
      await sleep(withJitter(cooldown));
    }
  }
}
