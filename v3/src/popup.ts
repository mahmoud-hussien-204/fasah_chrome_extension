let token: string;

let data: {
  name: string;
  customsDeclarationNumber: string;
  truckNumber: string;
}[];

const apiBaseUrls = {
  baseUrl: "https://tms.tabadul.sa/api/appointment/tas/v2/",
  fleetBaseUrl: "https://tms.tabadul.sa/api/fleet/v2/",
};

const getTomorrowDate = () => {
  return new Date(Date.now() + 86400000) // Add 24 hours in milliseconds
    .toLocaleDateString("en-CA") // 'en-CA' gives YYYY-MM-DD format
    .replace(/-/g, "/"); // Replace hyphens with slashes
};

const api = async (
  path: string,
  requestInit = {} as RequestInit,
  baseUrl = apiBaseUrls.baseUrl
) => {
  const headers = {
    "Accept-Language": "ar",
    Accept: "application/json",
    token: decodeURIComponent(token),
  };

  const response = await fetch(`${baseUrl + path}`, {
    method: "GET",
    ...requestInit,
    headers: {
      ...headers,
      ...requestInit?.headers,
    },
  });

  const responseJson = await response.json();

  return responseJson;
};

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
  const stopBtn = document.getElementById("stop-btn");
  fillingCompletedSuccessfully(false);
  stopBtn?.classList.remove("hidden");
  // show loading spinner
  toggleLoadingSpinner(true);
  setLoadingSpinnerMessage("جاري معالجة البيانات...");
  toggleFormEnabling("disable");
  await tabGetToken();
  let savedData = false;
  if (!data || !data.length) {
    savedData = saveFormData();
  } else {
    savedData = true;
  }
  if (savedData) {
    await makeApiRequests();
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

async function tabGetToken() {
  await new Promise((resolve) => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const currentTab = tabs[0];
      chrome.tabs.sendMessage(currentTab.id!, {action: "getToken"}, (response) => {
        if (response.status === "success") {
          if (response.message === "getToken") {
            token = response.data.token;
            resolve(true);
          }
        }
      });
    });
  });
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

const apiGetSchedule = async () => {
  setLoadingSpinnerMessage("جارى البحث عن مواعيد...");

  const searchParams = new URLSearchParams({
    economicOperator: "",
    type: "TRANSIT",
    // ***
    departure: "KFC",
    arrival: "31",
    // **** for exit (test)
    // finalDest: "95",
  });

  const response = await api(`zone/schedule/land?${searchParams.toString()}`);

  // success response
  if (Reflect.has(response, "schedules")) {
    // get the third last element from the array if there is more than 3 elements
    const schedules = response.schedules;
    const schedule = schedules.length > 3 ? schedules[schedules.length - 3] : schedules[0];
    return schedule;
  }

  // error response
  if (response?.success === false) {
    if (response?.errors?.[0]?.message.includes("تم تجاوز الحد الأقصى")) {
      let refillingIsClicked = false;
      setLoadingSpinnerMessage(
        " تم تجاوز الحد الأقصى هنستنى 15 ثواني وبعدين نعيد المحاولة لو مش هتستنى انت تقدر "
      );
      const refillingForm = document.createElement("button");
      refillingForm.innerText = "تضغط هنا";
      refillingForm.classList.add("text-primary", "cursor-pointer");
      refillingForm.addEventListener("click", () => {
        refillingIsClicked = true;
        startFillingForm();
      });
      const message = document.getElementById("message");
      message?.appendChild(refillingForm);
      const fiveSecondWaiting = await new Promise((resolve) =>
        setTimeout(() => {
          if (refillingIsClicked) {
            resolve(false);
          } else {
            resolve(true);
          }
        }, 15000)
      );
      if (fiveSecondWaiting) {
        return apiGetSchedule();
      }
      return;
    }
    return apiGetSchedule();
  }
};

const apiGetInfo = async (user: (typeof data)[0]) => {
  setLoadingSpinnerMessage("جاري البحث عن معلومات السائق... والشاحنة");
  const truckSearchParams = new URLSearchParams({
    finalDestination: "95",
    finalDestinationTime: getTomorrowDate(),
    q: user.truckNumber,
  });

  const truckResponse = await api(
    `truck/verified/all/forAdd?${truckSearchParams.toString()}`,
    undefined,
    apiBaseUrls.fleetBaseUrl
  );

  const driverSearchParams = new URLSearchParams({
    finalDestination: "95",
    finalDestinationTime: getTomorrowDate(),
    q: user.name,
  });

  const driverResponse = await api(
    `driver/verified/all/forAdd?${driverSearchParams.toString()}`,
    undefined,
    apiBaseUrls.fleetBaseUrl
  );

  return {
    truck: truckResponse.content?.[0],
    driver: driverResponse.content?.[0],
    data: user,
  };
};

const createAppointment = async (appointment: {
  driver: any;
  truck: any;
  data: any;
  schedule: any;
}) => {
  setLoadingSpinnerMessage("جاري حجز الموعد...");
  const payload = {
    purpose: "6",
    fleet_info: [
      {
        licenseNo: appointment.driver.licenseNo,
        residentCountry: appointment.driver.residentCountry,
        plateCountry: appointment.truck.plateCountry,
        vehicleSequenceNumber: appointment.truck.vehicleSequenceNumber,
        chassisNo: appointment.truck.chassisNo,
      },
    ],
    transit: {
      transit_port_code: appointment.schedule.port_code,
      transit_schedule_id: appointment.schedule.zone_schedule_id,
    },
    declaration_number: appointment.data.customsDeclarationNumber,
  };
  const response = await api("appointment/transit/create", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response;
};

async function makeApiRequests() {
  const getScheduleData = await apiGetSchedule();
  if (getScheduleData) {
    const getInfoData = await apiGetInfo(data?.[0]);
    if (getInfoData?.driver && getInfoData.truck && getInfoData.data) {
      const createAppointmentResponse = await createAppointment({
        ...getInfoData,
        schedule: getScheduleData,
      });
      if (createAppointmentResponse) {
        fillingCompletedSuccessfully(true);
        toggleFormEnabling("enable");
        toggleLoadingSpinner(false);
        document.getElementById("stop-btn")?.classList.add("hidden");
      }
    }
  }
}

function fillingCompletedSuccessfully(show: boolean) {
  const alert = document.getElementById("success-alert");
  if (show) {
    alert?.classList.add("flex");
    alert?.classList.remove("hidden");
  } else {
    alert?.classList.add("hidden");
    alert?.classList.remove("flex");
  }
}
