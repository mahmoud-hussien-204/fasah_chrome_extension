console.log("Background script loaded");
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    console.log("Intercepted request:", details);
    if (details.method === "POST" && details.requestBody) {
      console.log("Request Body:", details.requestBody);
    }
  },
  {urls: ["https://tms.tabadul.sa/api/appointment/tas/v2/appointment/transit/create"]},
  ["requestBody"]
);
