let token: string;

let observers = {
  gettenSchedule: false,
};

const apiBaseUrls = {
  baseUrl: "https://tms.tabadul.sa/api/appointment/tas/v2/",
  fleetBaseUrl: "https://tms.tabadul.sa/api/fleet/v2/",
  mockBaseUrl: "https://67fbc19b1f8b41c81684c4e8.mockapi.io/api/fasah/v1/",
};

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  token =
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("fsession="))
      ?.split("=")[1] || "";

  switch (message.action) {
    case "start": {
      funcObserveSchedule(message.data);
      sendResponse({status: "success", message: "start", data: {message: ""}});
      break;
    }
    case "stop": {
      break;
    }
    default: {
      break;
    }
  }

  return true;
});

function funcObserveSchedule(userData: any) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      console.log("mutation", mutation);

      if (observers.gettenSchedule) return;
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        const addedNode = mutation.addedNodes[0];
        if (addedNode.nodeType === Node.ELEMENT_NODE) {
          const element = addedNode as Element;
          if (element.classList.contains("bootstrap-datetimepicker-widget")) {
            const dayesElement = element.querySelector(".datepicker-days");
            if (dayesElement) {
              const firstDayIsEnabled = dayesElement.querySelector(
                "td:not(.disabled)"
              ) as HTMLDivElement;
              if (firstDayIsEnabled) {
                firstDayIsEnabled.click();
                firstDayIsEnabled.dispatchEvent(new Event("click"));
                observer.disconnect();
                observers.gettenSchedule = true;
                setTimeout(() => {
                  const input =
                    document.querySelectorAll("table > tbody > tr input[type=radio]").length > 3
                      ? document.querySelector(
                          "table > tbody > tr:has(input[type=radio]):nth-last-child(3) input[type=radio]"
                        )
                      : document.querySelector(
                          "table > tbody > tr:has(input[type=radio]):last-child input[type=radio]"
                        );

                  console.log("input", input);

                  if (!input) return;
                  // @ts-expect-error fix later
                  input.checked = true;
                  input.dispatchEvent(new Event("change"));
                  input.dispatchEvent(new Event("click"));
                  const nextButton = document.querySelector(
                    "button[data-i18n=nextButtonText]"
                  ) as HTMLButtonElement;
                  if (!nextButton) return;
                  nextButton.click();
                  apiGetInfo(userData);
                }, 200);
              }
            }
          }
        }
      }
    });
  });

  // first observe the scheduals
  observer.observe(document.getElementById("finalSchedule") as Element, {
    childList: true,
  });
}

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

const getTomorrowDate = () => {
  return new Date(Date.now() + 86400000) // Add 24 hours in milliseconds
    .toLocaleDateString("en-CA") // 'en-CA' gives YYYY-MM-DD format
    .replace(/-/g, "/"); // Replace hyphens with slashes
};

const apiGetInfo = async (user: any) => {
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

  if (!truckResponse?.content?.[0]) {
    throw new Error("يوجد خطأ فى معلومات الشاحنة");
  }

  if (!driverResponse?.content?.[0]) {
    throw new Error("يوجد خطأ فى معلومات السائق");
  }

  const findTrucks = truckResponse.content.filter(
    (truck: any) => truck.plateNumberAr.trim() === user.truckNumber.trim()
  );

  const findDrivers = driverResponse.content.filter((driver: any) =>
    (driver.nameAr as string).trim().startsWith(user.name.trim())
  );

  const entryElement = document.getElementById("entry");

  if (entryElement) {
    entryElement.setAttribute(
      "records",
      JSON.stringify([
        {
          truck: {
            plate_number: findTrucks?.[0].plateNumberAr,
            plateCountry: findTrucks?.[0].plateCountry,
            vehicleSequenceNumber: findTrucks?.[0].vehicleSequenceNumber,
            consignmentNumber: "",
            truckCategoryGroup: findTrucks?.[0].truckCategoryGroup,
            categoryGroupCode: findTrucks?.[0].categoryGroupCode,
            truckColorCode: findTrucks?.[0].truckColorCode,
            plateType: findTrucks?.[0].plateType,
            chassisNo: findTrucks?.[0].chassisNo,
          },
          driver: {
            DRIVER_NAME: findDrivers?.[0].nameAr,
            LICENSE_NUMBER: findDrivers?.[0].licenseNo,
            residentCountry: findDrivers?.[0].residentCountry,
          },
        },
      ])
    );

    console.log("findTrucks", findTrucks, findDrivers);
  }
};
