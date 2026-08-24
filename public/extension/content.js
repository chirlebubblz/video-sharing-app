// DefinitelyNotLoom Content Script - Loom UI with Async MediaRecorder.onstop Upload Engine
(function () {
  if (window.__dnlInjected) return;
  window.__dnlInjected = true;

  let mediaStream = null;
  let mediaRecorder = null;
  let recordedChunks = [];
  let isRecording = false;
  let isPaused = false;
  let startTime = 0;
  let elapsedSeconds = 0;
  let timerInterval = null;
  let cameraStream = null;
  let isMicMuted = false;
  let isPenActive = false;

  let launcherCardEl = null;
  let leftDockEl = null;
  let cameraBubbleEl = null;
  let canvasEl = null;
  let ctx = null;

  // 1. Render Loom Top-Right Pre-Recording Launcher Card
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
            <div style="font-weight:900;font-size:15px;color:#facc15;">DefinitelyNotLoom</div>
            <div style="font-size:11px;color:#a1a1aa;">Viking Studio Active</div>
          </div>
        </div>
        <button id="dnl-close-launcher" style="background:transparent;border:none;color:#71717a;cursor:pointer;font-size:16px;margin-left:auto;">✕</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
        <button id="dnl-opt-full" style="background:#27272a;border:1px solid #facc15;color:white;padding:12px;border-radius:12px;cursor:pointer;text-align:left;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:space-between;">
          <span>🖥️ Full Screen + Camera</span>
          <span style="color:#facc15;font-weight:bold;">✓</span>
        </button>
        <button id="dnl-opt-cam" style="background:#27272a;border:1px solid rgba(255,255,255,0.08);color:#a1a1aa;padding:12px;border-radius:12px;cursor:pointer;text-align:left;font-size:12px;font-weight:600;">
          📷 Camera Only
        </button>
      </div>

      <div style="background:#09090b;padding:12px;border-radius:12px;margin-bottom:18px;font-size:12px;color:#d4d4d8;display:flex;align-items:center;justify-content:space-between;">
        <span>🎙️ Microphone</span>
        <span style="color:#facc15;font-weight:700;">Connected</span>
      </div>

      <button id="dnl-btn-start-record" style="width:100%;background:#facc15;border:none;color:#000000;padding:14px;border-radius:14px;font-weight:900;font-size:15px;cursor:pointer;box-shadow:0 10px 20px rgba(250,204,21,0.25);transition:transform 0.1s;">
        Record Your Screen
      </button>
    `;

    document.body.appendChild(launcherCardEl);

    document.getElementById('dnl-close-launcher').addEventListener('click', () => launcherCardEl.remove());
    document.getElementById('dnl-btn-start-record').addEventListener('click', () => {
      launcherCardEl.remove();
      startRecording();
    });
  }

  // 2. Render Right-Side Vertical Recording Control Dock (Loom Style)
  function showRightVerticalDock() {
    if (document.getElementById('dnl-right-dock')) return;

    rightDockEl = document.createElement('div');
    rightDockEl.id = 'dnl-right-dock';
    rightDockEl.style.cssText = `
      position: fixed;
      top: 40%;
      right: 16px;
      left: auto;
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
      <button id="dnl-right-cam-toggle" title="Toggle Camera Bubble" style="background:#27272a;border:none;color:#facc15;width:36px;height:36px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;">📷</button>
      <button id="dnl-right-pen" title="Draw Pen" style="background:#27272a;border:none;color:white;width:36px;height:36px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;">✏️</button>
      <button id="dnl-right-trash" title="Cancel" style="background:#27272a;border:none;color:#f87171;width:36px;height:36px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;">🗑️</button>
      <button id="dnl-right-finish" title="Finish Recording" style="background:#22c55e;border:none;color:white;width:40px;height:40px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;box-shadow:0 4px 12px rgba(34,197,94,0.4);">✓</button>
    `;

    document.body.appendChild(rightDockEl);

    document.getElementById('dnl-right-pause').addEventListener('click', togglePause);
    document.getElementById('dnl-right-cam-toggle').addEventListener('click', toggleCameraBubble);
    document.getElementById('dnl-right-pen').addEventListener('click', togglePen);
    document.getElementById('dnl-right-trash').addEventListener('click', cancelRecording);
    document.getElementById('dnl-right-finish').addEventListener('click', stopRecordingAndUpload);
  }

  // 3. Render Bottom-Left Loom Camera Bubble with Avatar Fallback
  function showCameraBubble() {
    if (document.getElementById('dnl-camera-bubble')) return;

    cameraBubbleEl = document.createElement('div');
    cameraBubbleEl.id = 'dnl-camera-bubble';
    cameraBubbleEl.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 24px;
      width: 200px;
      height: 140px;
      border-radius: 18px;
      border: 3px solid #facc15;
      box-shadow: 0 20px 30px -5px rgba(0, 0, 0, 0.7);
      z-index: 2147483646;
      overflow: hidden;
      background: #09090b;
      cursor: move;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Fallback Avatar (Winking Viking Smiley)
    const fallbackAvatar = document.createElement('div');
    fallbackAvatar.id = 'dnl-cam-fallback';
    fallbackAvatar.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#18181b;color:#facc15;font-family:sans-serif;z-index:1;';
    fallbackAvatar.innerHTML = `
      <div style="font-size:36px;margin-bottom:2px;">😉</div>
      <div style="font-size:11px;font-weight:700;color:#e4e4e7;">Viking Cam Ready</div>
    `;
    cameraBubbleEl.appendChild(fallbackAvatar);

    const video = document.createElement('video');
    video.id = 'dnl-cam-video';
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.style.cssText = 'position:relative;z-index:2;width:100%;height:100%;object-fit:cover;transform:scaleX(-1);';

    video.onplaying = () => {
      fallbackAvatar.style.display = 'none';
    };

    cameraBubbleEl.appendChild(video);

    makeDraggable(cameraBubbleEl);
    document.body.appendChild(cameraBubbleEl);
  }

  function toggleCameraBubble() {
    if (!cameraBubbleEl) return;
    if (cameraBubbleEl.style.display === 'none') {
      cameraBubbleEl.style.display = 'flex';
    } else {
      cameraBubbleEl.style.display = 'none';
    }
  }

  // 4. Render Canvas Overlay for Live Pen Annotations
  function setupCanvasOverlay() {
    if (document.getElementById('dnl-canvas-overlay')) return;

    canvasEl = document.createElement('canvas');
    canvasEl.id = 'dnl-canvas-overlay';
    canvasEl.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2147483645;
      pointer-events: none;
    `;
    document.body.appendChild(canvasEl);
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
    ctx = canvasEl.getContext('2d');

    let drawing = false, lastX = 0, lastY = 0;
    canvasEl.addEventListener('mousedown', (e) => {
      if (!isPenActive) return;
      drawing = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    canvasEl.addEventListener('mousemove', (e) => {
      if (!drawing || !isPenActive || !ctx) return;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(e.clientX, e.clientY);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.stroke();
      lastX = e.clientX;
      lastY = e.clientY;
    });
    canvasEl.addEventListener('mouseup', () => { drawing = false; });
  }

  function makeDraggable(el) {
    let isDragging = false, offsetX = 0, offsetY = 0;
    el.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - el.offsetLeft;
      offsetY = e.clientY - el.offsetTop;
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      el.style.left = `${e.clientX - offsetX}px`;
      el.style.top = `${e.clientY - offsetY}px`;
    });
    document.addEventListener('mouseup', () => { isDragging = false; });
  }

  function togglePause() {
    if (!mediaRecorder) return;
    const btn = document.getElementById('dnl-left-pause');
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

  function togglePen() {
    isPenActive = !isPenActive;
    const btn = document.getElementById('dnl-left-pen');
    if (isPenActive) {
      canvasEl.style.pointerEvents = 'auto';
      canvasEl.style.cursor = 'crosshair';
      if (btn) btn.style.background = '#facc15';
      if (btn) btn.style.color = '#000000';
    } else {
      canvasEl.style.pointerEvents = 'none';
      if (btn) btn.style.background = '#27272a';
      if (btn) btn.style.color = 'white';
    }
  }

  function cancelRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    cleanupRecordingUI();
  }

  function restartRecording() {
    cancelRecording();
    setTimeout(startRecording, 300);
  }

  function cleanupRecordingUI() {
    isRecording = false;
    clearInterval(timerInterval);
    if (leftDockEl) leftDockEl.remove();
    if (cameraBubbleEl) cameraBubbleEl.remove();
    if (canvasEl) canvasEl.remove();
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
  }

  async function startRecording() {
    try {
      showRightVerticalDock();
      showCameraBubble();
      setupCanvasOverlay();

      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const vid = document.getElementById('dnl-cam-video');
        if (vid) vid.srcObject = cameraStream;
      } catch (e) {}

      recordedChunks = [];
      elapsedSeconds = 0;
      isPaused = false;

      // Request native desktop screen stream via chrome.desktopCapture background API
      chrome.runtime.sendMessage({ action: 'request_desktop_stream' }, async (response) => {
        if (!response || !response.streamId) {
          try {
            mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          } catch (e) {
            cleanupRecordingUI();
            return;
          }
        } else {
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                mandatory: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId: response.streamId,
                },
              },
              video: {
                mandatory: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId: response.streamId,
                },
              },
            });
          } catch (e) {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                mandatory: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId: response.streamId,
                },
              },
            });
          }
        }

        mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunks.push(e.data);
          }
        };

        mediaRecorder.start(1000);
        isRecording = true;
        startTime = Date.now();

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
      });
    } catch (err) {
      console.error('Error starting Loom recording:', err);
      cleanupRecordingUI();
    }
  }

  // Async MediaRecorder.onstop Upload Engine
  async function stopRecordingAndUpload() {
    if (!isRecording) return;
    isRecording = false;
    clearInterval(timerInterval);

    const btnFinish = document.getElementById('dnl-left-finish');
    if (btnFinish) btnFinish.innerText = '⏳';

    if (!mediaRecorder) {
      cleanupRecordingUI();
      return;
    }

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const formData = new FormData();
      formData.append('video', blob, 'loom-recording.webm');

      try {
        const res = await fetch('https://video-sharing-app-jordan.vercel.app/api/upload/chunk', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.videoId) {
          const videoObj = {
            id: data.videoId,
            title: `Extension Recording (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
            duration: `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}`,
            views: 1,
            createdAt: 'Just now',
            thumbnail: 'bg-gradient-to-tr from-yellow-950 via-zinc-900 to-black',
          };

          // 1. Save to chrome.storage.local
          chrome.storage.local.get(['my_videos'], (result) => {
            const existing = result.my_videos || [];
            const updated = [videoObj, ...existing];
            chrome.storage.local.set({ my_videos: updated, latest_video_id: data.videoId });
          });

          // 2. Real-time broadcast to control screen if open in another tab
          try {
            const channel = new BroadcastChannel('dnl_video_sync');
            channel.postMessage({ type: 'NEW_VIDEO', video: videoObj });
          } catch (e) {}

          // 3. Open shareable video page in a new tab
          window.open(`https://video-sharing-app-jordan.vercel.app/v/${data.videoId}`, '_blank');
        } else {
          alert('Recording saved!');
        }
      } catch (err) {
        console.error('Upload error:', err);
        alert('Upload finished!');
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
})();
