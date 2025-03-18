document.addEventListener("DOMContentLoaded", () => {
  const trucksSection = document.querySelector(".trucks");
  const trucksList = document.getElementById("trucks-list");
  const submitBtn = document.getElementById("submit");
  const clearStorageBtn = document.getElementById("clear-storage");
  const startBtn = document.getElementById("start");
  const loadingDiv = document.getElementById("loading");

  let isFillingForm = false;

  // Load existing data from localStorage and set initial Start button state
  loadStoredData();

  // Add new truck input pair
  trucksList.addEventListener("click", (event) => {
    if (event.target.classList.contains("add-truck")) {
      const truckEntry = document.createElement("div");
      truckEntry.className = "truck-entry";
      truckEntry.innerHTML = `
        <input type="text" class="truck-name" placeholder="اسم السائق">
        <input type="text" class="truck-number" placeholder="رقم السيارة">
        <input type="text" class="truck-declaration-number" placeholder="رقم البيان الجمركى">
        <div class="flex items-center truck-actions">
          <button class="delete-btn delete-truck">x</button>
          <button class="add-truck">+</button>
        </div>
      `;
      trucksList.appendChild(truckEntry);
      updateAddButtonPosition();
      const newNameInput = truckEntry.querySelector(".truck-name");
      newNameInput.focus();
      attachDeleteListeners();
      attachInputListeners();
      updateDeleteButtonVisibility();
      startBtn.classList.add("hidden");
    }
  });

  // Submit and save to localStorage with validation
  submitBtn.addEventListener("click", () => {
    const trucks = [];
    let hasError = false;

    document.querySelectorAll(".truck-entry").forEach((entry) => {
      const nameInput = entry.querySelector(".truck-name");
      const numberInput = entry.querySelector(".truck-number");
      const declarationNumberInput = entry.querySelector(".truck-declaration-number");
      const name = nameInput.value.trim();
      const number = numberInput.value.trim();
      const declarationNumber = declarationNumberInput.value.trim();

      nameInput.classList.remove("error");
      numberInput.classList.remove("error");
      declarationNumberInput.classList.remove("error");

      if (!name) {
        nameInput.classList.add("error");
        hasError = true;
      }
      if (!number) {
        numberInput.classList.add("error");
        hasError = true;
      }
      if (!declarationNumber) {
        declarationNumberInput.classList.add("error");
        hasError = true;
      }
      if (name && number && declarationNumber) {
        trucks.push({name, truckNumber: number, customsDeclarationNumber: declarationNumber});
      }
    });

    if (hasError) {
      alert("يرجى ملء جميع الحقول المطلوبة!");
    } else if (trucks.length > 0) {
      localStorage.setItem("truckData", JSON.stringify(trucks));
      alert("تم حفظ البيانات في التخزين المحلي!");
      startBtn.classList.remove("hidden");
    } else {
      alert("يرجى إضافة شاحنة واحدة على الأقل ببيانات صحيحة.");
    }
  });

  // Clear localStorage and reset UI
  clearStorageBtn.addEventListener("click", () => {
    localStorage.removeItem("truckData");
    trucksList.innerHTML = `
      <div class="truck-entry">
        <input type="text" class="truck-name" placeholder="اسم السائق">
        <input type="text" class="truck-number" placeholder="رقم السيارة">
        <input type="text" class="truck-declaration-number" placeholder="رقم البيان الجمركى">
        <div class="flex items-center truck-actions">
          <button class="delete-btn delete-truck">x</button>
          <button class="add-truck">+</button>
        </div>
      </div>
    `;
    attachDeleteListeners();
    attachInputListeners();
    updateDeleteButtonVisibility();
    updateAddButtonPosition();
    startBtn.classList.add("hidden");
    alert("تم مسح التخزين!");
  });

  // Start button: Fill form on specific page
  startBtn.addEventListener("click", () => {
    const truckData = JSON.parse(localStorage.getItem("truckData") || "[]");
    if (truckData.length === 0) {
      alert("لا توجد بيانات محفوظة للتعبئة!");
      return;
    }

    revertUI();

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const currentTab = tabs[0];
      const targetUrlPattern = /^https:\/\/oga\.fasah\.sa\/[^\/]+\/broker\/2\.0\/.*$/;
      const urlMatches = targetUrlPattern.test(currentTab.url);

      if (urlMatches) {
        chrome.tabs.sendMessage(
          currentTab.id,
          {
            action: "start",
            data: truckData,
          },
          (response) => {
            if (response && response.success) {
            } else {
            }
          }
        );
      } else {
        alert("يرجى فتح الصفحة المستهدفة: " + targetUrlPattern);
      }
    });
  });

  // Attach delete listeners to delete buttons
  function attachDeleteListeners() {
    document.querySelectorAll(".delete-truck").forEach((btn) => {
      btn.removeEventListener("click", handleDelete);
      btn.addEventListener("click", handleDelete);
    });
  }

  // Handle delete action
  function handleDelete(event) {
    const entry = event.target.parentElement.parentElement;
    const totalEntries = document.querySelectorAll(".truck-entry").length;
    if (totalEntries > 1) {
      entry.remove();
      updateDeleteButtonVisibility();
      updateAddButtonPosition();
      startBtn.classList.add("hidden");
    } else {
      alert("لا يمكن حذف آخر إدخال!");
    }
  }

  // Load stored data on startup
  function loadStoredData() {
    const storedData = localStorage.getItem("truckData");
    if (storedData) {
      const trucks = JSON.parse(storedData);
      trucksList.innerHTML = "";
      trucks.forEach((truck, index) => {
        const truckEntry = document.createElement("div");
        truckEntry.className = "truck-entry";
        truckEntry.innerHTML = `
          <input type="text" class="truck-name" value="${truck.name}" placeholder="اسم السائق">
           <input type="text" class="truck-number" value="${
             truck.truckNumber
           }" placeholder="رقم السيارة">
          <input type="text" class="truck-declaration-number" value="${
            truck.customsDeclarationNumber
          }" placeholder="رقم البيان الجمركى">
          <div class="flex items-center truck-actions">
            <button class="delete-btn delete-truck">x</button>
            ${index === trucks.length - 1 ? '<button class="add-truck">+</button>' : ""}
          </div>
        `;
        trucksList.appendChild(truckEntry);
      });
      attachDeleteListeners();
      attachInputListeners();
      updateDeleteButtonVisibility();
      startBtn.classList.remove("hidden");
    } else {
      updateDeleteButtonVisibility();
      updateAddButtonPosition();
      startBtn.classList.add("hidden");
    }
  }

  // Update visibility of delete buttons
  function updateDeleteButtonVisibility() {
    const entries = document.querySelectorAll(".truck-entry");
    const deleteButtons = document.querySelectorAll(".delete-truck");
    if (entries.length === 1) {
      deleteButtons.forEach((btn) => btn.classList.add("hidden"));
    } else {
      deleteButtons.forEach((btn) => btn.classList.remove("hidden"));
    }
  }

  // Ensure "+" button is only on the last entry
  function updateAddButtonPosition() {
    const entries = document.querySelectorAll(".truck-entry");
    entries.forEach((entry, index) => {
      const actionsDiv = entry.querySelector(".truck-actions");
      const addButton = actionsDiv.querySelector(".add-truck");
      if (index === entries.length - 1) {
        if (!addButton) {
          const newAddButton = document.createElement("button");
          newAddButton.className = "add-truck";
          newAddButton.textContent = "+";
          actionsDiv.appendChild(newAddButton);
        }
      } else {
        if (addButton) {
          addButton.remove();
        }
      }
    });
  }

  // Attach input listeners for error handling and Start button hiding
  function attachInputListeners() {
    document
      .querySelectorAll(".truck-name, .truck-number, .truck-declaration-number")
      .forEach((input) => {
        input.addEventListener("input", () => {
          if (input.value.trim()) {
            input.classList.remove("error");
          }
          startBtn.classList.add("hidden");
        });
      });
  }

  function revertUI() {
    if (isFillingForm) {
      trucksSection.classList.remove("hidden");
      loadingDiv.classList.add("hidden");
      isFillingForm = false;
    } else {
      trucksSection.classList.add("hidden");
      loadingDiv.classList.remove("hidden");
      isFillingForm = true;
    }
  }

  // Initial setup
  attachDeleteListeners();
  attachInputListeners();
  updateAddButtonPosition();
});
