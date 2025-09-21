let userToken = localStorage.getItem("token");

let userData = JSON.parse(localStorage.getItem("userData"));

document.addEventListener("DOMContentLoaded", function () {
  const loginBtn = document.getElementById("login-btn");

  const startBtn = document.getElementById("start-btn");

  const stopBtn = document.getElementById("stop-btn");

  const loading = document.getElementById("loading");

  const actionsElement = document.getElementById("actions");

  const loginFormElement = document.getElementById("login-form");

  const alertElement = document.getElementById("alert");

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
    showActionsElement();
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
          userData = result;
          localStorage.setItem("token", "generated");
          localStorage.setItem("userData", JSON.stringify(result));
          showActionsElement();
        } else {
          alertElement.textContent = "بيانات الدخول غير صحيحة";
        }
        loading.classList.add("hidden");
      });
    }
  }
  // ****** end login handler

  startBtn.addEventListener("click", () => {
    if (isChromeBrowser()) {
      countTabsWithExtension().then((response) => {
        if (userData && userData.isOk && userData.active && response < userData.count) {
          console.log("verified");
          // ok you are authorized -> run the content.js
          startBtn.classList.add("hidden");
          stopBtn.classList.remove("hidden");
          executeContentScriptOnCurrentTab();
        }
      });
    }
  });

  stopBtn.addEventListener("click", () => {
    stopBtn.classList.add("hidden");
    startBtn.classList.remove("hidden");
    validateTab((tab) => {
      chrome.tabs.sendMessage(tab.id, {action: "stop"});
    });
  });
});

function isChromeBrowser() {
  const userAgent = navigator.userAgent;
  return userAgent.includes("Chrome");
}

function countTabsWithExtension() {
  return new Promise((resolve) => {
    chrome.tabs.query({url: "https://oga.fasah.sa/*"}, (tabs) => {
      console.log("tabs", tabs);

      resolve(tabs.length);
    });
  });
}

function validateTab(callback) {
  // Get the current active tab where the popup was opened
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs.length === 0) return;

    const tab = tabs[0];

    if (!tab.url || !tab.url.includes("https://oga.fasah")) return;

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
