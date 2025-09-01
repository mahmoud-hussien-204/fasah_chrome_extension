document.addEventListener("DOMContentLoaded", function () {
  const startBtn = document.getElementById("start-btn");

  startBtn.addEventListener("click", () => {
    if (isChromeBrowser()) {
      countTabsWithExtension().then((response) => {
        if (response < 4) {
          // ok you are authorized -> run the content.js
          executeContentScriptOnCurrentTab();
        }
      });
    }
  });
});

function isChromeBrowser() {
  const userAgent = navigator.userAgent;
  return userAgent.includes("Chrome");
}

function countTabsWithExtension() {
  return new Promise((resolve) => {
    chrome.tabs.query({url: "https://fasah.zatca.gov.sa/*"}, (tabs) => {
      resolve(tabs.length);
    });
  });
}

function executeContentScriptOnCurrentTab() {
  // Get the current active tab where the popup was opened
  chrome.tabs.query({active: true, currentWindow: true}, (tabs, ...rr) => {
    if (tabs.length === 0) return;

    const tab = tabs[0];

    const allowedUrls = ["https://fasah.zatca.gov.sa/*"];

    // تحقق إن التاب الحالي ضمن الـ URLs المسموح بيها
    if (!allowedUrls.some((url) => tab.url.startsWith(url))) return;

    // if (!tab.url || !tab.url.includes("https://oga.fasah.sa/")) return;

    chrome.scripting.executeScript(
      {
        target: {tabId: tab.id},
        files: ["content.js"],
      },
      () => {
        chrome.tabs.sendMessage(tab.id, {action: "start"});
      }
    );
  });
}
