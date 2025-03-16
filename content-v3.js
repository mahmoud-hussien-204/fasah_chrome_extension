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
  datePicker: {
    waiting: 600,
  },
  customsDeclarationNumber: {
    waiting: 500,
  },
  truckNumber: {
    waiting: 200,
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

    // run transitTimeType if purpose is already filled
    if (isFilledPurpose.isFilled && !isFilledPurpose.isOk) {
      fillTransitTimeTypeSelect(document.body).then((result) => {
        if (result.isFilled && !result.isOk) {
          console.log("is ok run accessPort");
        }
      });
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        console.log("mutation", mutation);
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            fillTransitTimeTypeSelect(node);
            fillAccessPortSelect(node);
            // detectIfthereIsNo(node);
            const isFilledDatePicker = fillDatePicker(node);
            if (isFilledDatePicker.isFilled && isFilledDatePicker.isOk) {
              fillCustomsDeclarationNumber(document.body, data[selectedIndex]);
            }
            fillTruckNumber(node, data[selectedIndex]);
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
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

async function detectIfthereIsNo(node) {
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

    fillAccessPortSelect(document.body);
  };

  if (isAlertLimitExceeded) {
    retry(60000);
    return;
  }

  if (!isAlert) return;

  retry();
}

function fillDatePicker(node) {
  const datePickerElement = node.querySelector(".tab-pane:first-child .datepicker");

  if (!datePickerElement) return {isFilled: false, isOk: false};

  datePickerElement.querySelector("td:not(.disabled)").click();

  const input =
    document.querySelectorAll("table > tbody > tr input[type=radio]").length > 3
      ? document.querySelector(
          "table > tbody > tr:has(input[type=radio]):nth-last-child(3) input[type=radio]"
        )
      : document.querySelector(
          "table > tbody > tr:has(input[type=radio]):nth-last-child input[type=radio]"
        );
  input.checked = true;

  input.dispatchEvent(new Event("change"));

  document.querySelector("div.wizard-action-buttons button[data-i18n=nextButtonText]").click();

  return {isFilled: true, isOk: true};
}

async function fillCustomsDeclarationNumber(node, data) {
  const customsDeclarationNumberInput = node.querySelector(
    "input[name='broker:create_appointment:decleration_number']"
  );

  if (!customsDeclarationNumberInput) return {isFilled: false, isOk: false};

  customsDeclarationNumberInput.value = data.customsDeclarationNumber;

  customsDeclarationNumberInput.dispatchEvent(new Event("input"));

  const customsDeclarationNumberButton = node.querySelector(
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

async function fillTruckNumber(node, data) {
  const truckNumberButton = node.querySelector(`button[id='driver1']`);

  if (!truckNumberButton) return {isFilled: false, isOk: false};

  truckNumberButton.click();

  // await new Promise((resolve) => {
  //   setTimeout(() => {
  //     resolve();
  //   }, options.truckNumber.waiting);
  // });

  const truckNumberInput = document.querySelector(
    ".modal.show input[test-attr='data-table-search-field']"
  );

  console.log("truckNumberInput", truckNumberInput, node);

  if (!truckNumberInput) return {isFilled: false, isOk: false};

  truckNumberInput.value = data.truckNumber;

  truckNumberInput.dispatchEvent(new Event("input"));

  truckNumberInput.dispatchEvent(new Event("change"));

  return {isFilled: true, isOk: true};
}
