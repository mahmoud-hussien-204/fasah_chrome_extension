chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  switch (message.action) {
    case "getToken": {
      // get token from cookies
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("fsession="))
        ?.split("=")[1];

      sendResponse({status: "success", message: "getToken", data: {token}});
      break;
    }
    case "stop": {
      break;
    }
    case "start": {
      break;
    }
    default: {
      break;
    }
  }

  return true;
});
