const fakeData = [
  {
    name: "الصادق عبدالعظيم",
    customsDeclarationNumber: 248079,
    truckNumber: 6363,
  },
];

const apiBaseUrls = {
  baseUrl: "https://tms.tabadul.sa/api/appointment/tas/v2/",
  fleetBaseUrl: "https://tms.tabadul.sa/api/fleet/v2/",
};

const getTomorrowDate = () => {
  return new Date(Date.now() + 86400000) // Add 24 hours in milliseconds
    .toLocaleDateString("en-CA") // 'en-CA' gives YYYY-MM-DD format
    .replace(/-/g, "/"); // Replace hyphens with slashes
};

const api = async (path, requestInit = {}, baseUrl = apiBaseUrls.baseUrl) => {
  // get token from cookies
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("fsession="))
    ?.split("=")[1];
  const headers = {
    Accept: "application/json",
    "Accept-Language": "ar",
    token: decodeURIComponent(token),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: {
      ...headers,
      ...requestInit?.headers,
    },
  });
  const responseJson = await response.json();
  return responseJson;
};

const apiGetSchedule = async () => {
  const searchParams = new URLSearchParams({
    economicOperator: null,
    type: "TRANSIT",
    // ***
    departure: "KFC",
    arrival: 31,
    // **** for exit (test)
    // finalDest: 95,
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
      await new Promise((resolve) => setTimeout(resolve, 60000));
      return apiGetSchedule();
    }
    return apiGetSchedule();
  }
};

const apiGetInfo = async (user) => {
  const truckSearchParams = new URLSearchParams({
    finalDestination: 95,
    finalDestinationTime: getTomorrowDate(),
    q: user.truckNumber,
  });

  const truckResponse = await api(
    `truck/verified/all/forAdd?${truckSearchParams.toString()}`,
    undefined,
    apiBaseUrls.fleetBaseUrl
  );

  const driverSearchParams = new URLSearchParams({
    finalDestination: 95,
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

const createAppointment = async (appointment) => {
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
  });
  return response;
};

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  switch (message.action) {
    case "stop": {
      break;
    }
    case "start": {
      const getScheduleData = await apiGetSchedule();

      if (getScheduleData) {
        const getInfoData = await apiGetInfo(message.data[0]);
        if (getInfoData?.driver && getInfoData.truck && getInfoData.data) {
          const createAppointmentResponse = await createAppointment(getInfoData);
          console.log("response createAppointmentResponse", createAppointmentResponse);
        }
      }

      sendResponse({
        status: "success",
      });
      break;
    }
    default: {
      break;
    }
  }
});
