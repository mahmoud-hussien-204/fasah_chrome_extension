const options = {
  purpose: {
    value: 6,
  },
  transitTimeType: {
    value: "entry", // "entry" or "exit"
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
    waiting: 1500,
  },
  truckName: {
    waiting: 200,
  },
  datePicker: {
    waiting: 200,
  },
};

let isSearching = false;

let searchType;

// Flag to prevent multiple responses
let hasResponded = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "start") {
    const data = message.data;
    const selectedIndex = message.selectedIndex || 0;
    hasResponded = false; // Reset flag for each new message

    const isFilledPurpose = fillPurposeSelect();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        console.log("Mutation detected:", mutation);

        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            fillTransitTimeTypeSelect(node);
            fillAccessPortSelect(node);
            detectIfThereIsNo(node);
            fillDatePicker(node);
            searchOnTruckData(node, data[selectedIndex]);
            chooseTruckData(node, data[selectedIndex]);
            detectIfThereIsFinished(node);
          });
        } else if (mutation.type === "attributes") {
          if (mutation.attributeName === "disabled") {
            fillCustomsDeclarationNumber(mutation.target, data[selectedIndex]);
            getSchedulesButton(mutation.target);
            addTruckButton(mutation.target, () => {
              if (!hasResponded) {
                console.log("Sending response to popup");
                sendResponse({success: true, selectedIndex: selectedIndex + 1});
                hasResponded = true; // Mark as responded
              } else {
                console.log("Response already sent, skipping");
              }
            });
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

    return true; // Keep the message channel open for async response
  }
});

function isMoreThanOneModalPresent() {
  const modals = document.querySelectorAll(".modal");
  if (modals.length) {
    return true;
  }
  return false;
}

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
    ?.innerText.includes("لا يوجد مواعيد متاحة");

  const isAlertLimitExceeded = node
    .querySelector("div.fasah-alert-body")
    ?.innerText.includes("تم تجاوز الحد الأقصى");

  const isAlertErrorOcured = node
    .querySelector("div.fasah-alert-body")
    ?.innerText.includes("لقد حصل خطأ في النظام");

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

  if (isAlertLimitExceeded || isAlertErrorOcured) {
    retry(60000);
    return;
  }

  if (isAlertErrorOcured) {
    retry();
    return;
  }

  if (!isAlert) return;

  retry();
}

function detectIfThereIsFinished(node) {
  const modalElement = node.classList.contains("modal");

  if (!modalElement) return false;

  const isAlertIsSubmitted = node.querySelector("p[data-i18n='broker:AcceptedAppointments']");

  if (!isAlertIsSubmitted) return;

  const closeButton = node.querySelector("button[data-method='إغلاق']");

  if (!closeButton) return;

  closeButton.click();
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

  const thereIsMoreThanOneModal = isMoreThanOneModalPresent();

  if (!truckNumberButton || thereIsMoreThanOneModal) return {isFilled: false, isOk: false};

  searchType = "truckNumber";

  truckNumberButton.click();

  return {isFilled: true, isOk: true};
}

async function searchOnTruckData(node, data) {
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

  searchInput.value = searchType === "truckNumber" ? data.truckNumber : data.name;

  searchInput.dispatchEvent(new Event("input"));
  searchInput.dispatchEvent(new Event("change"));
  searchInput.dispatchEvent(new KeyboardEvent("keyup", {bubbles: true, key: "a"}));
  return true;
}

async function chooseTruckData(node, data) {
  const bodyElement = node.tagName === "TBODY";

  if (!bodyElement) return false;

  const isInModal = node.closest(".modal");

  if (!isInModal) return false;

  const isInDataTableContainer = node.closest(".data-table-container");

  if (!isInDataTableContainer || !isInDataTableContainer.dataset.totalElements) return false;

  const selectRecord = isInDataTableContainer.querySelector("tbody tr:first-child");

  if (!selectRecord) return false;

  try {
    const obj = selectRecord.dataset.obj;

    const parse = JSON.parse(obj);

    if (searchType === "truckNumber") {
      if (
        parse?.plateNumberAr == data.truckNumber ||
        parse?.plateNumberEn == data.truckNumber ||
        parse?.vehicleSequenceNumber == data.truckNumber
      ) {
        selectRecord.querySelector("button").click();
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, options.truckNumber.waiting);
        });
        await fillTruckName(document.querySelector(".tab-pane.wizard-step.active"));
      }
    } else if (searchType === "truckName") {
      console.log(
        "selected record",
        selectRecord,
        isInDataTableContainer.querySelectorAll("tbody tr")
      );
      if (parse?.nameAr === data.name) {
        selectRecord.querySelector("button").click();
      }
    }
  } catch (error) {
    console.log("error when select record", error);
  }
}

async function fillTruckName(node) {
  const truckNameButton = node.querySelector("button#truck1");

  const thereIsMoreThanOneModal = isMoreThanOneModalPresent();

  if (!truckNameButton || thereIsMoreThanOneModal) return {isFilled: false, isOk: false};

  searchType = "truckName";

  truckNameButton.click();

  return {isFilled: true, isOk: true};
}

async function addTruckButton(node, callback) {
  const addTruckBtn = node.dataset.i18n === "add" && node.tagName === "BUTTON" && !node.disabled;
  if (!addTruckBtn) return;
  node.click();
  const pledgeCheck = document.querySelector(".pledge-check input");
  if (!pledgeCheck) return;
  pledgeCheck.checked = true;
  pledgeCheck.dispatchEvent(new Event("change"));
  pledgeCheck.dispatchEvent(new Event("click"));

  const button = document.querySelector(
    "div.wizard-action-buttons button[data-i18n=submitButtonText]"
  );
  button.click();
  button.dispatchEvent(new Event("click"));
  if (callback) callback();
}
