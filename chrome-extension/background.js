// DefinitelyNotLoom Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('DefinitelyNotLoom Chrome Extension installed successfully.');
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
});
