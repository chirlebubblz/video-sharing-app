// Not Another Video Sharing App - Content Script & Google Drive Engine
(function () {
  if (window.__dnlInjected) return;
  window.__dnlInjected = true;

  let mediaStream = null;
  let mediaRecorder = null;
  let recordedChunks = [];
  let isRecording = false;
  let isPaused = false;
  let elapsedSeconds = 0;
  let timerInterval = null;
  let cameraStream = null;
  let selectedMode = 'full'; // 'full' or 'cam'

  let launcherCardEl = null;
  let rightDockEl = null;
  let cameraBubbleEl = null;

  function showToastNotification(text) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 40px;
      right: 40px;
      background: #facc15;
      color: #000000;
      padding: 14px 20px;
      border-radius: 14px;
      font-family: system-ui, -apple-system, sans-serif;
      font-weight: 900;
      font-size: 14px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.8);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    toast.innerHTML = `<span>✨</span> <span>${text}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // 1. Render Pre-Recording Launcher Card with Full Screen & Camera Only options
  function showLauncherCard() {
    if (document.getElementById('dnl-loom-launcher')) return;

    launcherCardEl = document.createElement('div');
    launcherCardEl.id = 'dnl-loom-launcher';
    launcherCardEl.style.cssText = `
      position: fixed;
      top: 60px;
      right: 30px;
      width: 320px;
      background: #18181b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      z-index: 2147483647;
      padding: 20px;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
      backdrop-filter: blur(16px);
    `;

    launcherCardEl.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:34px;height:34px;border-radius:10px;background:#facc15;color:#000000;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;">😉</div>
          <div>
            <div style="font-weight:900;font-size:14px;color:#facc15;">Not Another Video Sharing App</div>
            <div style="font-size:11px;color:#a1a1aa;">Studio Active</div>
          </div>
        </div>
        <button id="dnl-close-launcher" style="background:transparent;border:none;color:#71717a;cursor:pointer;font-size:16px;margin-left:auto;">✕</button>
      </div>

      <button id="dnl-btn-connect-drive" style="width:100%;background:#09090b;border:1px solid #facc15;color:#facc15;padding:10px;border-radius:12px;font-weight:700;font-size:12px;cursor:pointer;margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.2s;">
        📁 Connect Google Drive Account
      </button>

      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
        <button id="dnl-opt-full" style="background:#27272a;border:1px solid #facc15;color:white;padding:12px;border-radius:12px;cursor:pointer;text-align:left;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:space-between;">
          <span>🖥️ Full Screen + Camera</span>
          <span id="dnl-chk-full" style="color:#facc15;font-weight:bold;">✓</span>
        </button>
        <button id="dnl-opt-cam" style="background:#18181b;border:1px solid rgba(255,255,255,0.08);color:#a1a1aa;padding:12px;border-radius:12px;cursor:pointer;text-align:left;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:space-between;">
          <span>📷 Camera Only</span>
          <span id="dnl-chk-cam" style="color:#facc15;font-weight:bold;display:none;">✓</span>
        </button>
      </div>

      <div style="background:#09090b;padding:12px;border-radius:12px;margin-bottom:18px;font-size:12px;color:#d4d4d8;display:flex;align-items:center;justify-content:space-between;">
        <span>🎙️ Microphone</span>
        <span style="color:#facc15;font-weight:700;">Connected</span>
      </div>

      <button id="dnl-btn-start-record" style="width:100%;background:#facc15;border:none;color:#000000;padding:14px;border-radius:14px;font-weight:900;font-size:15px;cursor:pointer;box-shadow:0 10px 20px rgba(250,204,21,0.25);transition:transform 0.1s;">
        Start Recording
      </button>
    `;

    document.body.appendChild(launcherCardEl);

    document.getElementById('dnl-close-launcher').addEventListener('click', () => launcherCardEl.remove());
    
    const optFull = document.getElementById('dnl-opt-full');
    const optCam = document.getElementById('dnl-opt-cam');
    const chkFull = document.getElementById('dnl-chk-full');
    const chkCam = document.getElementById('dnl-chk-cam');

    optFull.addEventListener('click', () => {
      selectedMode = 'full';
      optFull.style.borderColor = '#facc15';
      optFull.style.color = 'white';
      optFull.style.background = '#27272a';
      optCam.style.borderColor = 'rgba(255,255,255,0.08)';
      optCam.style.color = '#a1a1aa';
      optCam.style.background = '#18181b';
      chkFull.style.display = 'inline';
      chkCam.style.display = 'none';
    });

    optCam.addEventListener('click', () => {
      selectedMode = 'cam';
      optCam.style.borderColor = '#facc15';
      optCam.style.color = 'white';
      optCam.style.background = '#27272a';
      optFull.style.borderColor = 'rgba(255,255,255,0.08)';
      optFull.style.color = '#a1a1aa';
      optFull.style.background = '#18181b';
      chkCam.style.display = 'inline';
      chkFull.style.display = 'none';
    });

    const btnConnect = document.getElementById('dnl-btn-connect-drive');
    if (btnConnect) {
      btnConnect.addEventListener('click', async () => {
        try {
          btnConnect.innerText = '⏳ Opening Google Login...';
          const token = await getGoogleDriveAuthToken(true);
          if (token) {
            btnConnect.style.background = 'rgba(34,197,94,0.15)';
            btnConnect.style.borderColor = '#22c55e';
            btnConnect.style.color = '#4ade80';
            btnConnect.innerText = '✅ Google Drive Connected!';
          }
        } catch (e) {
          btnConnect.innerText = '📁 Click to Connect Google Drive';
        }
      });
    }

    document.getElementById('dnl-btn-start-record').addEventListener('click', () => {
      launcherCardEl.remove();
      startRecording();
    });
  }

  // 2. Render Vertical Control Dock
  function showRightVerticalDock() {
    if (document.getElementById('dnl-right-dock')) return;

    rightDockEl = document.createElement('div');
    rightDockEl.id = 'dnl-right-dock';
    rightDockEl.style.cssText = `
      position: fixed;
      top: 40%;
      right: 16px;
      transform: translateY(-50%);
      background: #18181b;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.7);
      z-index: 2147483647;
      padding: 10px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    rightDockEl.innerHTML = `
      <div id="dnl-timer" style="font-family:monospace;font-size:13px;font-weight:800;color:#facc15;background:rgba(250,204,21,0.15);padding:4px 8px;border-radius:8px;">00:00</div>
      <button id="dnl-right-pause" title="Pause / Resume" style="background:#27272a;border:none;color:white;width:36px;height:36px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;">⏸️</button>
      <button id="dnl-right-finish" title="Finish Recording" style="background:#22c55e;border:none;color:white;width:40px;height:40px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;box-shadow:0 4px 12px rgba(34,197,94,0.4);">✓</button>
    `;

    document.body.appendChild(rightDockEl);

    document.getElementById('dnl-right-pause').addEventListener('click', togglePause);
    document.getElementById('dnl-right-finish').addEventListener('click', stopRecordingAndUpload);
  }

  function togglePause() {
    if (!mediaRecorder) return;
    const btn = document.getElementById('dnl-right-pause');
    const timerEl = document.getElementById('dnl-timer');

    if (isPaused) {
      mediaRecorder.resume();
      isPaused = false;
      if (btn) btn.innerText = '⏸️';
      if (timerEl) timerEl.style.color = '#facc15';
    } else {
      mediaRecorder.pause();
      isPaused = true;
      if (btn) btn.innerText = '▶️';
      if (timerEl) timerEl.style.color = '#fbbf24';
    }
  }

  function cleanupRecordingUI() {
    isRecording = false;
    clearInterval(timerInterval);
    if (rightDockEl) rightDockEl.remove();
    if (cameraBubbleEl) cameraBubbleEl.remove();
    if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
  }

  async function startRecording() {
    try {
      recordedChunks = [];
      elapsedSeconds = 0;
      isPaused = false;

      if (selectedMode === 'cam') {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (e) {
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      } else {
        try {
          mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        } catch (e) {
          console.warn('Screen capture canceled or error:', e);
          cleanupRecordingUI();
          return;
        }
      }

      showRightVerticalDock();

      let options = { mimeType: 'video/webm' };
      if (!MediaRecorder.isTypeSupported('video/webm')) {
        options = { mimeType: 'video/mp4' };
      }

      mediaRecorder = new MediaRecorder(mediaStream, options);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      mediaRecorder.start(1000);
      isRecording = true;

      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        if (!isPaused) {
          elapsedSeconds++;
          const mins = Math.floor(elapsedSeconds / 60);
          const secs = String(elapsedSeconds % 60).padStart(2, '0');
          const timerEl = document.getElementById('dnl-timer');
          if (timerEl) timerEl.innerText = `${mins}:${secs}`;
        }
      }, 1000);

      mediaStream.getVideoTracks()[0].onended = () => {
        stopRecordingAndUpload();
      };
    } catch (err) {
      console.error('Error starting recording:', err);
      cleanupRecordingUI();
    }
  }

  // Upload recording to Google Drive & auto-copy link to clipboard instantly
  async function stopRecordingAndUpload() {
    if (!isRecording) return;
    isRecording = false;
    clearInterval(timerInterval);

    const btnFinish = document.getElementById('dnl-right-finish');
    if (btnFinish) btnFinish.innerText = '⏳';

    if (!mediaRecorder) {
      cleanupRecordingUI();
      return;
    }

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'video/webm' });
      if (blob.size === 0) {
        cleanupRecordingUI();
        return;
      }

      const filename = `recording-${Date.now()}.webm`;
      const videoId = `vid-${Date.now()}`;

      try {
        let driveResult = null;
        try {
          driveResult = await uploadVideoToGoogleDrive(blob, filename);
        } catch (gErr) {
          console.warn('Google Drive upload notice:', gErr);
        }

        if (driveResult && driveResult.driveViewUrl) {
          try {
            await navigator.clipboard.writeText(driveResult.driveViewUrl);
            showToastNotification('Google Drive Share Link Copied to Clipboard!');
          } catch (cErr) {}
          window.open(driveResult.driveViewUrl, '_blank');
        } else {
          // If Drive upload wasn't connected yet, prompt login
          try {
            const token = await getGoogleDriveAuthToken(true);
            if (token) {
              driveResult = await uploadVideoToGoogleDrive(blob, filename);
              if (driveResult && driveResult.driveViewUrl) {
                try {
                  await navigator.clipboard.writeText(driveResult.driveViewUrl);
                  showToastNotification('Google Drive Share Link Copied to Clipboard!');
                } catch (cErr) {}
                window.open(driveResult.driveViewUrl, '_blank');
                return;
              }
            }
          } catch (e) {}

          // Zero-Loss Fallback: Download file directly to computer!
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          showToastNotification('Recording saved to your Downloads!');
        }
      } catch (err) {
        console.error('Upload error:', err);
      } finally {
        cleanupRecordingUI();
      }
    };

    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'start_recording') {
      showLauncherCard();
      sendResponse({ status: 'launcher_opened' });
    }
  });

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'START_LOOM_RECORDING_FROM_WEB') {
      showLauncherCard();
    }
  });
})();
