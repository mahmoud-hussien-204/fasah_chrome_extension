let userToken = localStorage.getItem("token");

let userData = JSON.parse(localStorage.getItem("userData"));

function updateUserData(data) {
  userData = data;
  localStorage.setItem("userData", JSON.stringify(data));
}

document.addEventListener("DOMContentLoaded", function () {
  const loginBtn = document.getElementById("login-btn");

  const startBtn = document.getElementById("start-btn");

  const stopBtn = document.getElementById("stop-btn");

  const loading = document.getElementById("loading");

  const actionsElement = document.getElementById("actions");

  const loginFormElement = document.getElementById("login-form");

  const alertElement = document.getElementById("alert");

  validateTab((tab) => {
    chrome.tabs.sendMessage(tab.id, {action: "status"}, (response) => {
      if (response && response?.isRunning) {
        startBtn.classList.add("hidden");
        stopBtn.classList.remove("hidden");
      } else {
        startBtn.classList.remove("hidden");
        stopBtn.classList.add("hidden");
      }
    });
  });

  function showActionsElement() {
    loginFormElement.classList.add("hidden");
    actionsElement.classList.remove("hidden");
  }

  function showLoginElement() {
    loginFormElement.classList.remove("hidden");
    actionsElement.classList.add("hidden");
  }

  // ********** login handler
  if (userToken) {
    verifyUser(userData.name, userData.password).then((result) => {
      if (result.isOk) {
        updateUserData(result);
        showActionsElement();
      }
    });
  } else {
    showLoginElement();
  }

  loginBtn.addEventListener("click", handleLogin);

  function handleLogin() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    if (username && password) {
      alertElement.textContent = "";
      loading.classList.remove("hidden");
      verifyUser(username, password).then((result) => {
        if (result.isOk) {
          updateUserData(result);
          localStorage.setItem("token", "generated");
          showActionsElement();
        } else {
          alertElement.textContent = "بيانات الدخول غير صحيحة";
        }
        loading.classList.add("hidden");
      });
    }
  }
  // ****** end login handler

  // start
  startBtn.addEventListener("click", () => {
    if (isChromeBrowser()) {
      countTabsWithExtension().then((response) => {
        if (userData && userData.isOk && userData.active && response < userData.count) {
          // ok you are authorized -> run the content.js
          startBtn.classList.add("hidden");
          stopBtn.classList.remove("hidden");
          executeContentScriptOnCurrentTab();
        }
      });
    }
  });
  // ****** end start

  // stop
  stopBtn.addEventListener("click", () => {
    stopBtn.classList.add("hidden");
    startBtn.classList.remove("hidden");
    validateTab((tab) => {
      chrome.tabs.sendMessage(tab.id, {action: "stop"});
    });
  });
  // ****** end stop
});

function isChromeBrowser() {
  const userAgent = navigator.userAgent;
  return userAgent.includes("Chrome") || userAgent.includes("Edg");
}

function countTabsWithExtension() {
  return new Promise((resolve) => {
    chrome.tabs.query({url: "https://fasah.zatca.gov.sa/*"}, (tabs) => {
      resolve(tabs.length);
    });
  });
}

function validateTab(callback) {
  // Get the current active tab where the popup was opened
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs.length === 0) return;

    const tab = tabs[0];

    if (!tab.url || !tab.url.includes("https://fasah")) return;

    callback(tab);
  });
}

function executeContentScriptOnCurrentTab() {
  validateTab((tab) => {
    chrome.tabs.sendMessage(tab.id, {action: "start"});
  });
}

async function verifyUser(userName, password) {
  const baseURL =
    "https://raw.githubusercontent.com/mahmoud-hussien-204/fasah_users/refs/heads/main/users.json";

  const response = await fetch(baseURL);

  const data = await response.json();

  const userData = data.users[userName];

  if (userData && userData.password === password) {
    return {
      isOk: true,
      ...userData,
    };
  }

  return {
    isOk: false,
  };
}
