export const FIND_ELEMENT_TIMEOUT = 50;

export const WAITING_LOADING_TIMEOUT = 50;

export const WAITING_MODAL_TIMEOUT = 200;

export const selectors = {
  loading: '.nprogress-busy',
  scheduleButton: "button[data-i18n='tms:getSchedules']",
  dayCell: ".tab-pane.active td.day:not(.disabled)[data-action='selectDay']",
  appointment:
    "form[i18n-title='broker:create_appointment:appointment_datails'] input[type='radio']",
  nextButton: 'button[data-i18n="nextButtonText"]',
  backButton: 'button[data-i18n="previous"]',
  submitForm: '.tab-pane.wizard-step.active #mutliAdded',
  submitButton: "#broker button[data-i18n='submitButtonText']",
  modalCloseIcon: '#modelcloseicon',
  modalContent: '.modal-content',
};

function checkElement(selector: string) {
  const el = document.querySelector(selector);
  return {
    exists: el && (el as HTMLElement)?.offsetParent !== null,
    element: el,
  };
}

async function waitForElement(
  selector: string,
  interval = FIND_ELEMENT_TIMEOUT,
  isRunning: boolean
): Promise<Element> {
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      if (!isRunning) {
        clearInterval(timer);
        reject('Operation cancelled');
      }
      const { element, exists } = checkElement(selector);
      if (exists && element) {
        clearInterval(timer);
        resolve(element);
      }
    }, interval);
  });
}

function triggerClickElement(element: Element) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function triggerChangeEventElement(element: HTMLInputElement) {
  element.checked = true;
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

async function closeModal(isRunning: boolean) {
  const closeModalButton = await dom.waitForElement(selectors.modalCloseIcon, undefined, isRunning);
  dom.triggerClickElement(closeModalButton);
  // for confirmation
  (closeModalButton as HTMLButtonElement).click();
  return await new Promise<boolean>((resolve) =>
    setTimeout(() => resolve(true), WAITING_MODAL_TIMEOUT)
  );
}

export const dom = {
  waitForElement,
  checkElement,
  triggerClickElement,
  triggerChangeEventElement,
  closeModal,
};
