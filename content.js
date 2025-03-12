chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "start") {
    let success = false;

    try {
      // Locate the select element
      const selectElement = document.querySelector(
        'select[test-attr="broker_create_appointment_purpose"]'
      );

      if (selectElement) {
        const optionToSelect = selectElement.querySelector('option[data-id="6"]');
        if (optionToSelect) {
          // Set the option as selected directly
          optionToSelect.selected = true;
          // Trigger a change event to notify the page (if needed)
          selectElement.dispatchEvent(new Event("change"));

          handleObserver();

          success = true;
        } else {
          console.error("لم يتم العثور على الخيار مع data-id='6'");
          success = false;
        }
      } else {
        console.error("لم يتم العثور على عنصر الـ select");
        success = false;
      }
    } catch (error) {
      console.error("خطأ أثناء تعبئة البيانات:", error);
      success = false;
    }

    // Send response back to popup
    sendResponse({success});
  }
});

function handleObserver() {
  const form = document.querySelector(".wizard-step-form");

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      console.log("mutation", mutation);

      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // Step 3: Check each added node for a new select element
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.tagName === "DIV" &&
            node.classList.contains("drop-down") &&
            node.classList.contains("form-group") &&
            node.classList.contains("col-6")
          ) {
            transitTimeType(node);
          }
        });
      }
    });
  });

  // Step 4: Start observing the form for child list changes, including subtrees
  observer.observe(form, {childList: true, subtree: true});
}

function transitTimeType(node) {
  const selectElement = node.querySelector(
    "select[test-attr='tms_create_appointment_transittype']"
  );
  console.log(selectElement);

  if (selectElement) {
    const optionToSelect = selectElement.querySelector('option[data-id="entry"]');
    if (!optionToSelect) return;
    console.log(optionToSelect);
    optionToSelect.selected = true;
    selectElement.dispatchEvent(new Event("change"));
  }
}
