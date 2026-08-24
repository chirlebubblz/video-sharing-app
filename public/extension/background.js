// DefinitelyNotLoom Background Service Worker
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('permission.html') });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'request_desktop_stream') {
    chrome.desktopCapture.chooseDesktopMedia(
      ['screen', 'window', 'tab', 'audio'],
      sender.tab,
      (streamId) => {
        if (!streamId) {
          sendResponse({ error: 'Permission denied or canceled' });
        } else {
          sendResponse({ streamId });
        }
      }
    );
    return true; // Keep message channel open for async response
  }

  if (request.action === 'open_permission_page') {
    chrome.tabs.create({ url: chrome.runtime.getURL('permission.html') });
    sendResponse({ status: 'opened' });
  }

  // Cross-origin relay for Home Screen Widescreen Monitor & Video Library
  if (
    request.action === 'RECORDING_STARTED' ||
    request.action === 'RECORDING_STOPPED' ||
    request.action === 'LIVE_FRAME' ||
    request.action === 'NEW_VIDEO'
  ) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.url && (tab.url.includes('video-sharing-app-jordan.vercel.app') || tab.url.includes('localhost'))) {
          chrome.tabs.sendMessage(tab.id, request).catch(() => {});
        }
      });
    });
  }
});
