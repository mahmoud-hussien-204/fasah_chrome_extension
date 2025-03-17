const options = {
  purpose: {
    value: 6,
  },
  transitTimeType: {
    value: "exit", // "entry" or "exit"
    waiting: 600,
  },
  accessPort: {
    value: 0,
    waiting: 600,
  },
  modal: {
    waiting: 500,
  },
  customsDeclarationNumber: {
    waiting: 500,
  },
  truckNumber: {
    waiting: 200,
  },
  datePicker: {
    waiting: 200,
  },
  searchOnTruckNumber: {
    waiting: 1000,
  },
};

const data = [
  {
    name: "احمد رمضان حافظ",
    truckNumber: 3732,
    customsDeclarationNumber: 100316,
  },
];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "start") {
    let success = false;

    let selectedIndex = 0;

    const isFilledPurpose = fillPurposeSelect();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        console.log("mutation detect", mutation);

        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            fillTransitTimeTypeSelect(node);
            fillAccessPortSelect(node);
            // detectIfThereIsNo(node);
            fillDatePicker(node);
            searchOnTruckNumber(node, data[selectedIndex]);
            chooseTruckNumber(node);
          });
        } else if (mutation.type === "attributes") {
          if (mutation.attributeName === "disabled") {
            fillCustomsDeclarationNumber(mutation.target, data[selectedIndex]);
            getSchedulesButton(mutation.target);
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled"],
    });
  }
});

function fillPurposeSelect() {
  const selectElement = document.querySelector(
    'select[test-attr="broker_create_appointment_purpose"]'
  );

  if (!selectElement) return {isFilled: false, isOk: false};

  if (selectElement.selectedIndex == options.purpose.value) return {isFilled: true, isOk: false};

  const optionToSelect = selectElement.querySelector(`option[data-id="${options.purpose.value}"]`);

  if (!optionToSelect) return false;

  optionToSelect.selected = true;

  selectElement.dispatchEvent(new Event("change"));

  return {isFilled: true, isOk: true};
}

async function fillTransitTimeTypeSelect(node) {
  const selectElement = node.querySelector(
    'select[test-attr="tms_create_appointment_transittype"]'
  );

  if (!selectElement) return {isFilled: false, isOk: false};

  const selectedElementOption = selectElement.options[selectElement.selectedIndex];

  if (selectedElementOption && selectedElementOption.dataset.id == options.transitTimeType.value) {
    return {isFilled: true, isOk: false};
  }

  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, options.transitTimeType.waiting);
  });

  const optionToSelect = selectElement.querySelector(
    `option[data-id="${options.transitTimeType.value}"]`
  );

  optionToSelect.selected = true;

  selectElement.dispatchEvent(new Event("change"));

  return {isFilled: true, isOk: true};
}

async function fillAccessPortSelect(node) {
  const selectElement = node.querySelector(
    'select[test-attr="broker_create_appointment_arrivalport"]'
  );

  if (!selectElement) return {isFilled: false, isOk: false};

  const selectedElementOption = selectElement.options[selectElement.selectedIndex];

  if (selectedElementOption) {
    selectElement.dispatchEvent(new Event("change"));
    return {isFilled: true, isOk: true};
  }

  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, options.accessPort.waiting);
  });

  const optionToSelect = selectElement.options[options.accessPort.value];

  if (!optionToSelect) return fillAccessPortSelect(node);

  optionToSelect.selected = true;

  selectElement.dispatchEvent(new Event("change"));

  return {isFilled: true, isOk: true};
}

async function fillCustomsDeclarationNumber(node, data) {
  const customsDeclarationNumberInput =
    node.name === "broker:create_appointment:decleration_number" ? node : null;

  if (!customsDeclarationNumberInput) return {isFilled: false, isOk: false};

  customsDeclarationNumberInput.value = data.customsDeclarationNumber;

  customsDeclarationNumberInput.dispatchEvent(new Event("input"));

  const customsDeclarationNumberButton = document.querySelector(
    "button.btn.btn-outline-info.btn-block[data-i18n='Search']"
  );

  if (!customsDeclarationNumberButton) return {isFilled: false, isOk: false};

  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, options.customsDeclarationNumber.waiting);
  });

  customsDeclarationNumberButton.click();

  return {isFilled: true, isOk: true};
}

function getSchedulesButton(node) {
  if (node.dataset.i18n !== "tms:getSchedules") return;
  node.click();
}

async function detectIfThereIsNo(node) {
  const modalElement = node.classList.contains("modal");

  if (!modalElement) return false;

  const isAlert = node
    .querySelector("div.fasah-alert-body")
    .innerText.includes("لا يوجد مواعيد متاحة");

  const isAlertLimitExceeded = node
    .querySelector("div.fasah-alert-body")
    .innerText.includes("تم تجاوز الحد الأقصى");

  const retry = async (timer = options.modal.waiting) => {
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, timer);
    });

    node.querySelector("button[id='modelcloseicon']").click();

    await new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, timer);
    });

    getSchedulesButton(document.querySelector("button[data-i18n='tms:getSchedules']"));
  };

  if (isAlertLimitExceeded) {
    retry(60000);
    return;
  }

  if (!isAlert) return;

  retry();
}

async function fillDatePicker(node) {
  const datePickerElement = node.querySelector(".tab-pane:first-child .datepicker");

  if (!datePickerElement) return {isFilled: false, isOk: false};

  datePickerElement.querySelector("td:not(.disabled)").click();

  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, options.datePicker.waiting);
  });

  const input =
    document.querySelectorAll("table > tbody > tr input[type=radio]").length > 3
      ? document.querySelector(
          "table > tbody > tr:has(input[type=radio]):nth-last-child(3) input[type=radio]"
        )
      : document.querySelector(
          "table > tbody > tr:has(input[type=radio]):last-child input[type=radio]"
        );

  if (!input) return {isFilled: false, isOk: false};

  input.checked = true;

  input.dispatchEvent(new Event("change"));
  input.dispatchEvent(new Event("click"));

  document.querySelector("div.wizard-action-buttons button[data-i18n=nextButtonText]").click();

  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, options.datePicker.waiting);
  });

  fillTruckNumber(document.querySelector(".tab-pane.wizard-step.active"));

  return {isFilled: true, isOk: true};
}

async function fillTruckNumber(node) {
  const truckNumberButton = node.querySelector("button#driver1");

  if (!truckNumberButton) return {isFilled: false, isOk: false};

  truckNumberButton.click();

  return {isFilled: true, isOk: true};
}

let isSearching = false;

async function searchOnTruckNumber(node, data) {
  console.log("isSearching", isSearching);

  if (isSearching) return;

  const bodyElement = node.tagName === "TBODY";

  if (!bodyElement) return false;

  const isInModal = node.closest(".modal");

  if (!isInModal) return false;

  const isInDataTableContainer = node.closest(".data-table-container");

  if (!isInDataTableContainer || !isInDataTableContainer.dataset.totalElements) return false;

  const selectRecord = isInDataTableContainer.querySelector("tr:first-child button");

  if (!selectRecord) return false;

  const searchInput = isInModal.querySelector(
    ".search-input input[test-attr='data-table-search-field']"
  );

  if (!searchInput || searchInput.value) return false;

  isSearching = true;

  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, options.searchOnTruckNumber.waiting);
  });

  searchInput.value = data.truckNumber;

  searchInput.dispatchEvent(new Event("input"));
  searchInput.dispatchEvent(new Event("change"));
  searchInput.dispatchEvent(new KeyboardEvent("keyup", {bubbles: true, key: "a"}));

  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, options.searchOnTruckNumber.waiting);
  });

  console.log(
    "isSearching",
    isSearching,
    document.querySelector(".modal.show .data-table-container tr:first-child button")
  );

  return true;
}

async function chooseTruckNumber(node) {}
