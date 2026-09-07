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

  // Stop recording -> Save locally FIRST -> Provide option to upload to Google Drive
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
      const durationStr = `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}`;

      // 1. STEP 1: IMMEDIATELY SAVE LOCALLY TO COMPUTER!
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        showToastNotification('Recording saved to your Downloads!');
      } catch (saveErr) {
        console.warn('Local save error:', saveErr);
      }

      // Save local record to storage
      const videoObj = {
        id: videoId,
        title: `${selectedMode === 'cam' ? 'Camera' : 'Screen'} Recording (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        duration: durationStr,
        views: 1,
        createdAt: 'Just now',
        filename: filename,
        isSavedLocally: true,
      };

      chrome.storage.local.get(['navsa_drive_videos'], (result) => {
        const existing = result.navsa_drive_videos || [];
        chrome.storage.local.set({
          navsa_drive_videos: [videoObj, ...existing],
          latest_video_id: videoId,
        });
      });

      cleanupRecordingUI();

      // 2. STEP 2: SHOW CLEAN MODAL WITH OPTION TO UPLOAD TO GOOGLE DRIVE
      showPostRecordingModal(blob, filename, videoId, durationStr);
    };

    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }

  // Modal presenting user the OPTION to upload to Google Drive after saving locally
  function showPostRecordingModal(blob, filename, videoId, durationStr) {
    const existing = document.getElementById('navsa-post-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'navsa-post-modal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #18181b;
      border: 2px solid #facc15;
      border-radius: 24px;
      padding: 28px;
      width: 440px;
      max-width: 90vw;
      color: #ffffff;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 25px 60px rgba(0,0,0,0.85);
      z-index: 2147483647;
      text-align: center;
      animation: navsaModalIn 0.2s ease-out;
    `;

    modal.innerHTML = `
      <style>
        @keyframes navsaModalIn {
          from { opacity: 0; transform: translate(-50%, -46%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
        .navsa-btn-primary {
          background: #facc15;
          color: #000000;
          border: none;
          font-weight: 800;
          font-size: 14px;
          padding: 14px 20px;
          border-radius: 14px;
          cursor: pointer;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.1s, background 0.15s;
          margin-bottom: 10px;
        }
        .navsa-btn-primary:hover {
          background: #eab308;
          transform: scale(1.02);
        }
        .navsa-btn-secondary {
          background: #27272a;
          color: #d4d4d8;
          border: 1px solid rgba(255,255,255,0.1);
          font-weight: 600;
          font-size: 13px;
          padding: 12px 18px;
          border-radius: 12px;
          cursor: pointer;
          width: 100%;
          transition: background 0.15s;
        }
        .navsa-btn-secondary:hover {
          background: #3f3f46;
          color: #ffffff;
        }
      </style>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:24px;">😉</span>
          <span style="font-weight:800;font-size:16px;color:#facc15;">Recording Saved!</span>
        </div>
        <button id="navsa-modal-close" style="background:transparent;border:none;color:#a1a1aa;font-size:18px;cursor:pointer;padding:4px;">✕</button>
      </div>

      <div style="background:#09090b;border:1px solid #27272a;border-radius:16px;padding:16px;margin-bottom:20px;text-align:left;">
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#4ade80;font-weight:700;margin-bottom:6px;">
          <span>💾</span> Saved Locally to Downloads
        </div>
        <div style="font-size:12px;color:#a1a1aa;word-break:break-all;margin-bottom:6px;">
          File: <strong style="color:#ffffff;">${filename}</strong>
        </div>
        <div style="font-size:12px;color:#71717a;">
          Duration: <strong style="color:#facc15;">${durationStr}</strong>
        </div>
      </div>

      <div id="navsa-upload-section">
        <p style="font-size:13px;color:#d4d4d8;margin-bottom:14px;line-height:1.4;">
          Want to share this video? Upload it to your <strong>Google Drive</strong> to get a public shareable link.
        </p>

        <button id="navsa-btn-upload-drive" class="navsa-btn-primary">
          <span>📁</span> Upload to Google Drive (Get Share Link)
        </button>
      </div>

      <button id="navsa-btn-done" class="navsa-btn-secondary">
        Keep Local & Close
      </button>
    `;

    document.body.appendChild(modal);

    document.getElementById('navsa-modal-close').addEventListener('click', () => modal.remove());
    document.getElementById('navsa-btn-done').addEventListener('click', () => modal.remove());

    const btnUpload = document.getElementById('navsa-btn-upload-drive');
    const uploadSection = document.getElementById('navsa-upload-section');

    btnUpload.addEventListener('click', async () => {
      btnUpload.disabled = true;
      btnUpload.style.opacity = '0.7';
      btnUpload.innerHTML = `<span>⏳</span> Uploading to Google Drive...`;

      try {
        const driveResult = await uploadVideoToGoogleDrive(blob, filename);

        if (driveResult && (driveResult.driveViewUrl || driveResult.fileId)) {
          const watchUrl = `https://video-sharing-app-jordan.vercel.app/v/${videoId}?driveId=${driveResult.fileId}&driveUrl=${encodeURIComponent(driveResult.driveViewUrl)}`;

          // Update storage with Drive link
          chrome.storage.local.get(['navsa_drive_videos'], (result) => {
            const existing = result.navsa_drive_videos || [];
            const updated = existing.map((v) =>
              v.id === videoId
                ? { ...v, fileId: driveResult.fileId, driveViewUrl: driveResult.driveViewUrl, isUploaded: true }
                : v
            );
            chrome.storage.local.set({ navsa_drive_videos: updated });
          });

          // Auto-copy share link to clipboard
          try {
            await navigator.clipboard.writeText(watchUrl);
          } catch (e) {}

          uploadSection.innerHTML = `
            <div style="background:rgba(34,197,94,0.15);border:1px solid #22c55e;border-radius:14px;padding:14px;margin-bottom:14px;text-align:left;">
              <div style="color:#4ade80;font-weight:800;font-size:14px;margin-bottom:4px;">
                ✅ Uploaded & Copied to Clipboard!
              </div>
              <div style="font-size:11px;color:#a1a1aa;word-break:break-all;">
                ${watchUrl}
              </div>
            </div>
            <button id="navsa-btn-open-watch" class="navsa-btn-primary" style="background:#22c55e;color:#000000;">
              <span>🎬</span> Open & Watch Video
            </button>
          `;

          document.getElementById('navsa-btn-open-watch').addEventListener('click', () => {
            window.open(watchUrl, '_blank');
            modal.remove();
          });

          showToastNotification('Google Drive Share Link Copied to Clipboard!');
        } else {
          throw new Error('Upload did not return a valid URL');
        }
      } catch (err) {
        console.error('Drive upload failed:', err);
        btnUpload.disabled = false;
        btnUpload.style.opacity = '1';
        btnUpload.innerHTML = `<span>⚠️</span> Retry Upload to Google Drive`;
        showToastNotification('Drive upload error: ' + (err.message || 'Check Google login'));
      }
    });
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
