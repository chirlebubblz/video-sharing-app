document.addEventListener('DOMContentLoaded', () => {
  const btnStart = document.getElementById('btn-start');
  const btnOpenControl = document.getElementById('btn-open-control');
  const btnViewLatest = document.getElementById('btn-view-latest');
  const btnPerm = document.getElementById('btn-perm');
  const btnDriveConnect = document.getElementById('btn-drive-connect');

  // 1. Connect Google Drive Account Button
  if (btnDriveConnect) {
    btnDriveConnect.addEventListener('click', async () => {
      btnDriveConnect.innerText = '⏳ Opening Google Login...';
      try {
        if (typeof getGoogleDriveAuthToken === 'function') {
          const token = await getGoogleDriveAuthToken(true);
          if (token) {
            btnDriveConnect.style.background = 'rgba(34,197,94,0.2)';
            btnDriveConnect.style.borderColor = '#22c55e';
            btnDriveConnect.style.color = '#4ade80';
            btnDriveConnect.innerText = '✅ Google Drive Connected!';
          } else {
            chrome.tabs.create({ url: 'https://accounts.google.com/' });
            btnDriveConnect.innerText = '✅ Google Login Opened';
          }
        } else {
          chrome.tabs.create({ url: 'https://accounts.google.com/' });
          btnDriveConnect.innerText = '✅ Google Login Opened';
        }
      } catch (err) {
        console.error('Drive connection error:', err);
        chrome.tabs.create({ url: 'https://accounts.google.com/' });
        btnDriveConnect.innerText = '✅ Google Login Opened';
      }
    });
  }

  // 2. Start Recording
  if (btnStart) {
    btnStart.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { action: 'start_recording' }, (res) => {
          if (chrome.runtime.lastError) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['driveStorage.js', 'content.js'],
            }, () => {
              chrome.tabs.sendMessage(tab.id, { action: 'start_recording' });
            });
          }
        });
        window.close();
      }
    });
  }

  if (btnOpenControl) {
    btnOpenControl.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://video-sharing-app-jordan.vercel.app/' });
    });
  }

  if (btnViewLatest) {
    btnViewLatest.addEventListener('click', () => {
      chrome.storage.local.get(['latest_video_id'], (result) => {
        if (result.latest_video_id) {
          chrome.tabs.create({ url: `https://video-sharing-app-jordan.vercel.app/v/${result.latest_video_id}` });
        } else {
          alert('No recordings found yet!');
        }
      });
    });
  }

  if (btnPerm) {
    btnPerm.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('permission.html') });
    });
  }
});
