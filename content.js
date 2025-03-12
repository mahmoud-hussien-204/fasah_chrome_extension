// content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "start") {
    // const truckData = message.data;
    // sendResponse({ success: true });
  }
});
