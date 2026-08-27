document.addEventListener('DOMContentLoaded', () => {
  const btnMedia = document.getElementById('btn-grant-media');
  const btnDrive = document.getElementById('btn-grant-drive');
  const btnFinish = document.getElementById('btn-finish-setup');
  const badgeMedia = document.getElementById('badge-media');
  const badgeDrive = document.getElementById('badge-drive');

  let mediaDone = false;
  let driveDone = false;

  function checkAllDone() {
    if (mediaDone || driveDone) {
      btnFinish.style.display = 'block';
    }
  }

  // 1. Camera & Microphone Permission
  btnMedia.addEventListener('click', async () => {
    try {
      btnMedia.innerText = '⏳ Requesting Media...';
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((t) => t.stop());
      
      btnMedia.style.display = 'none';
      badgeMedia.style.display = 'inline';
      mediaDone = true;
      checkAllDone();
    } catch (err) {
      btnMedia.innerText = '⚠️ Click Allow in Address Bar';
    }
  });

  // 2. Google Drive Account Sign-In
  btnDrive.addEventListener('click', async () => {
    btnDrive.innerText = '⏳ Opening Google Sign-In...';
    try {
      if (typeof getGoogleDriveAuthToken === 'function') {
        const token = await getGoogleDriveAuthToken(true);
        if (token) {
          btnDrive.style.display = 'none';
          badgeDrive.style.display = 'inline';
          driveDone = true;
          checkAllDone();
        } else {
          btnDrive.innerText = '📁 Sign In with Google Drive';
        }
      } else {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
          if (token) {
            btnDrive.style.display = 'none';
            badgeDrive.style.display = 'inline';
            driveDone = true;
            checkAllDone();
          } else {
            btnDrive.innerText = '📁 Sign In with Google Drive';
          }
        });
      }
    } catch (err) {
      console.error('Drive connection error:', err);
      btnDrive.innerText = '📁 Sign In with Google Drive';
    }
  });

  // 3. All Set Button
  btnFinish.addEventListener('click', () => {
    window.close();
  });
});
