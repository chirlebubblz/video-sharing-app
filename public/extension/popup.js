document.getElementById('btn-start').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'start_recording' }, (response) => {
      window.close();
    });
  }
});

document.getElementById('btn-perm').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'open_permission_page' });
  window.close();
});
