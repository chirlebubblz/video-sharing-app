document.getElementById('btn-start').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  // Check if page URL is supported by Chrome extension content scripts
  if (
    tab.url.startsWith('chrome://') ||
    tab.url.startsWith('edge://') ||
    tab.url.startsWith('https://chromewebstore.google.com')
  ) {
    alert(
      'Chrome security prevents extensions from running directly on internal chrome:// pages. Please switch to any webpage (e.g. google.com, github.com, wikipedia.org) and try again!'
    );
    return;
  }

  // Ensure content script is injected dynamically into the active tab
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });
  } catch (e) {
    console.warn('Script injection attempt:', e);
  }

  // Send start recording message to tab
  chrome.tabs.sendMessage(tab.id, { action: 'start_recording' }, () => {
    window.close();
  });
});

document.getElementById('btn-perm').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'open_permission_page' });
  window.close();
});
