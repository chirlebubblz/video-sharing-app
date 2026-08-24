document.getElementById('btn-start').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

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

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });
  } catch (e) {}

  chrome.tabs.sendMessage(tab.id, { action: 'start_recording' }, () => {
    if (chrome.runtime.lastError) {}
    window.close();
  });
});

// Open Main Control Screen / Video Library
document.getElementById('btn-open-control').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://video-sharing-app-jordan.vercel.app' });
  window.close();
});

// View Latest Recording Page
document.getElementById('btn-view-latest').addEventListener('click', () => {
  chrome.storage.local.get(['latest_video_id'], (result) => {
    if (result && result.latest_video_id) {
      chrome.tabs.create({ url: `https://video-sharing-app-jordan.vercel.app/v/${result.latest_video_id}` });
    } else {
      chrome.tabs.create({ url: 'https://video-sharing-app-jordan.vercel.app' });
    }
    window.close();
  });
});

document.getElementById('btn-perm').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'open_permission_page' });
  window.close();
});
