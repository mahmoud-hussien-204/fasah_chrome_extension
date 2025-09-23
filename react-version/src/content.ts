console.log('Content script running on', window.location.href);

function sayName(name: string) {
  console.log(`Hello ${name}`);
}

sayName('John');

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request.message);
  // Send a response back to the popup
  sendResponse({ reply: 'Message received by content script!' });
  return true; // Keep the message channel open for async response
});

console.log('Content script loaded on', window.location.href);
