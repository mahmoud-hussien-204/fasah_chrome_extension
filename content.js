chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "start") {
    let success = false;

    try {
      // Locate the initial select element
      const selectElement = document.querySelector(
        'select[test-attr="broker_create_appointment_purpose"]'
      );

      if (!selectElement) {
        console.error("لم يتم العثور على عنصر الـ select الأولي");
        sendResponse({success: false, error: "Initial select not found"});
        return;
      }

      const optionToSelect = selectElement.querySelector('option[data-id="6"]');
      if (!optionToSelect) {
        console.error("لم يتم العثور على الخيار مع data-id='6'");
        sendResponse({success: false, error: "Option with data-id='6' not found"});
        return;
      }

      // Select the option and trigger change
      optionToSelect.selected = true;
      selectElement.dispatchEvent(new Event("change"));
      success = true;

      // Set up observer and pass sendResponse to handle async completion
      handleObserver(sendResponse, message.data);
    } catch (error) {
      console.error("خطأ أثناء تعبئة البيانات:", error);
      sendResponse({success: false, error: error.message});
    }

    // Keep the connection open for async response
    return true; // Indicates sendResponse will be called asynchronously
  }
});

function handleObserver(sendResponse, trucks) {
  let currentTruckIndex = 0;
  const form = document.querySelector(".wizard-step-form");
  if (!form) {
    console.error("لم يتم العثور على النموذج wizard-step-form");
    sendResponse({success: false, error: "Form not found"});
    return;
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          transitTimeType(mutation, node, sendResponse);
          accessPort(mutation, node, sendResponse);
          selectSlot(mutation, node, sendResponse);
        });
      } else if (mutation.type === "attributes") {
        customsDeclarationNumber(mutation, trucks[currentTruckIndex].number, sendResponse);
        getSchedules(mutation, sendResponse);
      }
    });
  });

  observer.observe(form, {childList: true, subtree: true, attributeFilter: ["disabled"]});
}

// نوع موعد العبور
function transitTimeType(mutation, node, sendResponse) {
  if (!mutation || !node) return;

  const targetName = "tms_create_appointment_transittype";

  const transitTimeTypeSelectElIsTargetElement = mutation.target.getAttribute("test-attr");

  if (targetName !== transitTimeTypeSelectElIsTargetElement) return;

  const isEntryOptionElement = node.dataset.id === "entry";

  if (!isEntryOptionElement) return;

  setTimeout(() => {
    node.selected = true;
    mutation.target.dispatchEvent(new Event("change", {bubbles: true}));
    // sendResponse({success: true});
  }, 1000);
}

// منفذ الوصول
function accessPort(mutation, node, sendResponse) {
  if (!mutation || !node) return;

  const targetName = "broker_create_appointment_arrivalport";

  const transitTimeTypeSelectElIsTargetElement = mutation.target.getAttribute("test-attr");

  if (targetName !== transitTimeTypeSelectElIsTargetElement) return;

  setTimeout(() => {
    node.selected = true;
    mutation.target.dispatchEvent(new Event("change", {bubbles: true}));
  }, 500);
}

// رقم البيان الجمركى
function customsDeclarationNumber(mutation, customsDeclarationNumber, sendResponse) {
  if (mutation.target.name !== "broker:create_appointment:decleration_number") return;
  mutation.target.value = customsDeclarationNumber;
  mutation.target.dispatchEvent(new Event("change"));
  mutation.target.dispatchEvent(new Event("input"));
  mutation.target.form.querySelector("div.col-3 > button.btn.btn-outline-info.btn-block").click();
}

// المواعيد
function getSchedules(mainMutation, sendResponse) {
  if (mainMutation.target.dataset.i18n !== "tms:getSchedules") return;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          if (node.getAttribute("role") === "dialog" && node.classList.contains("modal")) {
            setTimeout(() => {
              node.querySelector("button[id='modelcloseicon']").click();
            }, 500);
          }
        });
      }
      if (mutation.type === "childList" && mutation.removedNodes.length > 0) {
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          if (node.getAttribute("role") === "dialog" && node.classList.contains("modal")) {
            setTimeout(() => {
              mainMutation.target.click();
            }, 500);
          }
        });
      }
    });
  });

  observer.observe(document.body, {childList: true});

  mainMutation.target.click();
}

function selectSlot(mutation, node, sendResponse) {
  console.log("mutation", mutation, node);
}
