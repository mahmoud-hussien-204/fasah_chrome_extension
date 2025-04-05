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
    Accept: "application/json",
    "Accept-Language": "ar",
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
  const startBtn = document.getElementById("start-btn");

  // const stopBtn = document.getElementById("stop-btn");

  startBtn?.addEventListener("click", startFillingForm);
});

async function startFillingForm() {
  // show loading spinner
  toggleLoadingSpinner();
  setLoadingSpinnerMessage("جاري معالجة البيانات...");
  toggleFormEnabling();
  await tabGetToken();
  const savedData = saveFormData();
  if (savedData) {
    makeApiRequests();
  }
}

function toggleLoadingSpinner() {
  const loadingSpinner = document.getElementById("filling-loading");
  if (loadingSpinner?.classList.contains("hidden")) {
    loadingSpinner?.classList.remove("hidden");
    loadingSpinner?.classList.add("flex");
  } else if (loadingSpinner?.classList.contains("flex")) {
    loadingSpinner?.classList.remove("flex");
    loadingSpinner?.classList.add("hidden");
  }
}

function setLoadingSpinnerMessage(message: string) {
  document.getElementById("message")!.innerText = message;
}

function toggleFormEnabling() {
  const form = document.getElementById("form");
  const inputs = form?.querySelectorAll("input");
  const submitBtn = form?.querySelector("button#start-btn") as HTMLButtonElement;

  inputs?.forEach((input) => {
    if (input.disabled) {
      input.disabled = false;
    } else {
      input.disabled = true;
    }
  });

  if (submitBtn?.disabled) {
    submitBtn.disabled = false;
  } else {
    submitBtn.disabled = true;
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
  const trucks: {
    name: string;
    truckNumber: string;
    customsDeclarationNumber: string;
  }[] = [];

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
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return apiGetSchedule();
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
        fillingCompletedSuccessfully();
      }
    }
  }
}

function fillingCompletedSuccessfully() {
  const alert = document.getElementById("success-alert");
  alert?.classList.add("block");
  alert?.classList.remove("hidden");
  toggleLoadingSpinner();
  toggleFormEnabling();
}
