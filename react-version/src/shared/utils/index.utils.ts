import { clsx, type ClassValue } from 'clsx';

import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isChromeBrowser() {
  const userAgent = navigator.userAgent;
  return userAgent.includes('Chrome') || userAgent.includes('Edg');
}

export async function validateTab(url: string | undefined) {
  return new Promise<chrome.tabs.Tab>((resolve, reject) => {
    if (!url) return reject('الرابط غير معرف');

    const isChrome = isChromeBrowser();

    if (!isChrome) reject('هذا المتصفح غير مدعوم');

    // Get the current active tab where the popup was opened
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;

      const tab = tabs[0];

      if (!tab.url || !tab.url.includes(url)) reject('البرنامج غير مفعل على هذه الصفحة');

      resolve(tab);
    });
  });
}

export function sendMessageToContentScript(tabID: number, action: string) {
  return chrome.tabs.sendMessage(tabID, { action });
}
