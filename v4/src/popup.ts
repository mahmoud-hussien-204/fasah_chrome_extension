let data: {
  name: string;
  customsDeclarationNumber: string;
  truckNumber: string;
}[];

document.addEventListener("DOMContentLoaded", () => {
  data = JSON.parse(localStorage.getItem("truckData") || "[]");

  loadStoredData();

  const startBtn = document.getElementById("start-btn");

  const stopBtn = document.getElementById("stop-btn");

  startBtn?.addEventListener("click", startFillingForm);

  stopBtn?.addEventListener("click", stopFillingForm);
});

function loadStoredData() {
  if (data && data.length) {
    const trucksList = document.getElementById("trucks-list");
    if (!trucksList) return;
    trucksList.innerHTML = "";
    data.forEach((truck, index) => {
      const truckEntry = document.createElement("li");
      truckEntry.className = "flex gap-4 truck-item";
      truckEntry.innerHTML = `
         <input
            type="text"
            id="truck-name"
            class="min-w-0 input input-bordered flex-1 h-[2.5rem] rounded-md"
            placeholder="اسم السائق"
            ${index === 0 ? "autofocus" : ""}
            value="${truck.name}"
          />
          <input
            type="text"
            id="truck-number"
            class="min-w-0 input input-bordered flex-1 h-[2.5rem] rounded-md"
            placeholder="رقم السيارة"
            value="${truck.truckNumber}"
          />
          <input
            type="text"
            id="truck-declaration-number"
            class="min-w-0 input input-bordered flex-1 h-[2.5rem] rounded-md"
            placeholder="رقم البيان الجمركى"
            value="${truck.customsDeclarationNumber}"
          />
      `;
      trucksList.appendChild(truckEntry);
    });
  }
}

async function startFillingForm() {
  const savedData = saveFormData();
  if (savedData) {
    const stopBtn = document.getElementById("stop-btn");
    stopBtn?.classList.remove("hidden");
    toggleLoadingSpinner(true);
    setLoadingSpinnerMessage("الرجاء الانتظار ...");
    toggleFormEnabling("disable");

    await new Promise(() => {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const currentTab = tabs[0];
        chrome.tabs.sendMessage(currentTab.id!, {action: "start", data: data?.[0]}, (response) => {
          console.log("response", response);

          // if (response?.status === "success") {
          //   if (response.message === "getToken") {
          //     token = response.data.token;
          //     resolve(true);
          //   }
          // } else {
          //   reject("لا يوجد توكن الرجاء تسجيل الدخول من تانى");
          // }
        });
      });
    });
  }
}

async function stopFillingForm() {
  window.location.reload();
}

function toggleLoadingSpinner(show: boolean) {
  const loadingSpinner = document.getElementById("filling-loading");
  if (show) {
    loadingSpinner?.classList.remove("hidden");
    loadingSpinner?.classList.add("flex");
  } else {
    loadingSpinner?.classList.remove("flex");
    loadingSpinner?.classList.add("hidden");
  }
}

function setLoadingSpinnerMessage(message: string) {
  document.getElementById("message")!.innerText = message;
}

function toggleFormEnabling(action: "enable" | "disable") {
  const form = document.getElementById("form");
  const inputs = form?.querySelectorAll("input");

  inputs?.forEach((input) => {
    if (action === "enable") {
      input.disabled = false;
    } else if (action === "disable") {
      input.disabled = true;
    }
  });

  toggleStartBtnEnabling(action);
}

function toggleStartBtnEnabling(action: "enable" | "disable") {
  const startBtn = document.getElementById("start-btn") as HTMLButtonElement;
  if (action === "enable") {
    startBtn.disabled = false;
  } else if (action === "disable") {
    startBtn.disabled = true;
  }
}

function saveFormData() {
  const trucks: typeof data = [];

  let hasError = false;

  document.querySelectorAll(".truck-item").forEach((item) => {
    const nameInput = item.querySelector("#truck-name") as HTMLInputElement;
    const numberInput = item.querySelector("#truck-number") as HTMLInputElement;
    const declarationNumberInput = item.querySelector(
      "#truck-declaration-number"
    ) as HTMLInputElement;
    const nameValue = nameInput.value.trim();
    const numberValue = numberInput.value.trim();
    const declarationNumberValue = declarationNumberInput.value.trim();

    nameInput.classList.remove("input-error");
    numberInput.classList.remove("input-error");
    declarationNumberInput.classList.remove("input-error");

    if (!nameValue) {
      nameInput.classList.add("input-error");
      hasError = true;
    }
    if (!numberValue) {
      numberInput.classList.add("input-error");
      hasError = true;
    }
    if (!declarationNumberValue) {
      declarationNumberInput.classList.add("input-error");
      hasError = true;
    }
    if (nameValue && numberValue && declarationNumberValue) {
      trucks.push({
        name: nameValue,
        truckNumber: numberValue,
        customsDeclarationNumber: declarationNumberValue,
      });
    }
  });

  if (hasError) {
    alert("يرجى ملء جميع الحقول المطلوبة!");
  } else if (trucks.length > 0) {
    localStorage.setItem("truckData", JSON.stringify(trucks));
    data = trucks;
    return true;
  } else {
    alert("يرجى إضافة شاحنة واحدة على الأقل ببيانات صحيحة.");
  }

  return false;
}
