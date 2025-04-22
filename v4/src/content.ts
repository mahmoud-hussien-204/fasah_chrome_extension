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
    console.log("mutations", mutations);

    mutations.forEach((mutation) => {
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
  console.log("apiGetInfo", user);

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

  const pledgeCheck = document.querySelector(".pledge-check input");
  if (!pledgeCheck) return;
  // @ts-expect-error fff
  pledgeCheck.checked = true;
  pledgeCheck.dispatchEvent(new Event("change"));
  pledgeCheck.dispatchEvent(new Event("click"));

  createDataTableElementForTruck({
    truck: findTrucks?.[0],
    driver: findDrivers?.[0],
  });

  createDataTableElementForDriver({
    truck: findTrucks?.[0],
    driver: findDrivers?.[0],
  });

  const buttonElement = document.querySelector("#mutliAdded hr + div button") as HTMLButtonElement;

  console.log("buttonElement", buttonElement);

  if (buttonElement) buttonElement.click();

  // if (entryElement) {
  //   entryElement.setAttribute(
  //     "records",
  //     JSON.stringify([
  // {
  //   truck: {
  //     plate_number: findTrucks?.[0].plateNumberAr,
  //     plateCountry: findTrucks?.[0].plateCountry,
  //     vehicleSequenceNumber: findTrucks?.[0].vehicleSequenceNumber,
  //     consignmentNumber: "",
  //     truckCategoryGroup: findTrucks?.[0].truckCategoryGroup,
  //     categoryGroupCode: findTrucks?.[0].categoryGroupCode,
  //     truckColorCode: findTrucks?.[0].truckColorCode,
  //     plateType: findTrucks?.[0].plateType,
  //     chassisNo: findTrucks?.[0].chassisNo,
  //   },
  //   driver: {
  //     DRIVER_NAME: findDrivers?.[0].nameAr,
  //     LICENSE_NUMBER: findDrivers?.[0].licenseNo,
  //     residentCountry: findDrivers?.[0].residentCountry,
  //   },
  // },
  //     ])
  //   );

  //   const pledgeCheck = document.querySelector(".pledge-check input");
  //   if (!pledgeCheck) return;
  //   // @ts-expect-error fff
  //   pledgeCheck.checked = true;
  //   pledgeCheck.dispatchEvent(new Event("change"));
  //   pledgeCheck.dispatchEvent(new Event("click"));

  //   // const button = document.querySelector(
  //   //   "div.wizard-action-buttons button[data-i18n=submitButtonText]"
  //   // ) as HTMLButtonElement;
  //   // button.click();
  // }
};

function createDataTableElementForTruck(obj: any) {
  const dataTable = document.createElement("data-table");

  dataTable.id = "list_truck";

  dataTable.setAttribute(
    "columns",
    JSON.stringify([
      {tlabel: "broker:vehicle_sequence_number", value: "vehicleSequenceNumber"},
      {tlabel: "broker:Plate_Number", value: "plateNumberAr"},
    ])
  );

  dataTable.setAttribute("click", "");

  dataTable.setAttribute(
    "actions",
    JSON.stringify([
      {
        tlabel: "broker:Select",
        class: "btn-primary col-12",
        click: "fasah.broker_create_appointment_auto.truckGeneralValidate",
      },
    ])
  );

  dataTable.setAttribute("class", "w-100");

  dataTable.setAttribute("vce-ready", "");

  const dataObj = {
    plateType: obj.truck.plateType,
    vehicleSequenceNumber: obj.truck.vehicleSequenceNumber,
    plateNumberAr: obj.truck.plateNumberAr,
    plateNumberEn: obj.truck.plateNumberEn,
    plateCountry: obj.truck.plateCountry,
    chassisNo: obj.truck.chassisNo,
    truckCategoryGroup: obj.truck.truckCategoryGroup,
    categoryGroupCode: obj.truck.categoryGroupCode,
    truckColor: obj.truck.truckColor,
    truckColorCode: obj.truck.truckColorCode,
  };
  // إضافة الـ innerHTML (المحتوى الداخلي)
  dataTable.innerHTML = `
    <div class="data-table-container col-12" data-total-elements="1">
      <div class="row">
        <div class="col-md-12 mt-2">
          <div class="table-responsive">
            <table class="fgrid table table-striped">
              <thead>
                <tr>
                  <th>رقم تسلسل السيارة</th>
                  <th>رقم اللوحة</th>
                  <th><span></span></th>
                </tr>
              </thead>
              <tbody>
                <tr data-node="0" data-obj="${JSON.stringify(dataObj)}" class="parent active">
                  <td>
                    <div role="group" class="btn-group w-100">
                      <button type="button" class="btn btn-sm btn-secondary btn-primary col-12">اختيار</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(dataTable);

  console.log("dataTable", dataTable);

  const buttonElement = dataTable.querySelector("button");

  console.log("buttonElement create for truck", buttonElement);

  if (buttonElement) buttonElement.click();
}

function createDataTableElementForDriver(obj: any) {
  const dataTable = document.createElement("data-table");

  // تعيين الـ attributes
  dataTable.id = "list_truck";

  dataTable.setAttribute(
    "columns",
    JSON.stringify([
      {tlabel: "broker:license_number", value: "licenseNo"},
      {tlabel: "broker:fullName", value: "nameAr"},
    ])
  );

  dataTable.setAttribute("click", "");

  dataTable.setAttribute(
    "actions",
    JSON.stringify([
      {
        tlabel: "broker:Select",
        class: "btn-primary col-12",
        click: "fasah.broker_create_appointment_auto.getSelectedDriver",
      },
    ])
  );

  dataTable.setAttribute("class", "w-100");

  dataTable.setAttribute("vce-ready", "");

  // استخراج البيانات من obj
  const dataObj = {
    licenseNo: obj.driver.licenseNo,
    nameAr: obj.driver.nameAr,
    nameEn: obj.driver.nameEn,
    residentCountry: obj.driver.residentCountry,
  };

  dataTable.innerHTML = `
    <div class="data-table-container col-12" data-total-elements="1">
      <div class="row">
        <div class="col-md-12 mt-2">
          <div class="table-responsive">
            <table class="fgrid table table-striped">
              <thead>
                <tr>
                  <th>رقم رخصة</th>
                  <th>الاسم</th>
                  <th><span></span></th>
                </tr>
              </thead>
              <tbody>
                <tr data-node="0" data-obj='${JSON.stringify(dataObj)}' class="parent active">
                  <td>
                    <div role="group" class="btn-group w-100">
                      <button type="button" class="btn btn-sm btn-secondary btn-primary col-12">اختيار</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(dataTable);

  console.log("dataTable", dataTable);

  const buttonElement = dataTable.querySelector("button");

  console.log("buttonElement create for driver", buttonElement);

  if (buttonElement) buttonElement.click();
}
