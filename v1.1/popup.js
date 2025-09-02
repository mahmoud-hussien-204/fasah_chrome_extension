const usersData = {
  // me
  fb7175ca8fd647e452e1f9a7efbf9959: {
    count: 4,
  },
};

document.addEventListener("DOMContentLoaded", function () {
  const startBtn = document.getElementById("start-btn");

  startBtn.addEventListener("click", () => {
    if (isChromeBrowser()) {
      countTabsWithExtension().then((response) => {
        verifyUser().then((result) => {
          if (result.isOk && result.visitorId) {
            const user = usersData[result.visitorId];
            if (response < user.count) {
              console.log("verified");
              // ok you are authorized -> run the content.js
              executeContentScriptOnCurrentTab();
            }
          }
        });
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
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs.length === 0) return;

    const tab = tabs[0];

    if (!tab.url || !tab.url.includes("https://fasah")) return;

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

async function verifyUser() {
  const fp = await FingerprintJS.load();
  const fpResult = await fp.get();
  const visitorId = fpResult.visitorId;

  console.log("visitorId", visitorId);

  if (visitorId in usersData) {
    return {
      isOk: true,
      visitorId,
    };
  }

  return {
    isOk: false,
    visitorId: null,
  };
}
