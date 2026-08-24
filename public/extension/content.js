// DefinitelyNotLoom Content Script - Full Feature Extension Controls
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

  let bubbleEl = null;
  let toolbarEl = null;
  let canvasEl = null;
  let ctx = null;

  function initUI() {
    // 1. Camera Bubble
    if (!document.getElementById('dnl-camera-bubble')) {
      bubbleEl = document.createElement('div');
      bubbleEl.id = 'dnl-camera-bubble';
      bubbleEl.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 30px;
        width: 180px;
        height: 180px;
        border-radius: 50%;
        border: 4px solid #6366f1;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        z-index: 2147483646;
        overflow: hidden;
        background: #0f172a;
        cursor: move;
        display: none;
      `;

      const video = document.createElement('video');
      video.id = 'dnl-cam-video';
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.style.cssText = 'width:100%;height:100%;object-fit:cover;transform:scaleX(-1);';
      bubbleEl.appendChild(video);

      makeDraggable(bubbleEl);
      document.body.appendChild(bubbleEl);
    }

    // 2. Control Dock with Play / Pause / Mute / Cam / Pen / Restart / Stop
    if (!document.getElementById('dnl-control-dock')) {
      toolbarEl = document.createElement('div');
      toolbarEl.id = 'dnl-control-dock';
      toolbarEl.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(99, 102, 241, 0.4);
        padding: 8px 18px;
        border-radius: 9999px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 10px;
        color: white;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        backdrop-filter: blur(12px);
      `;

      toolbarEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;margin-right:4px;">
          <span id="dnl-rec-dot" style="width:10px;height:10px;border-radius:50%;background:#ef4444;"></span>
          <span id="dnl-timer" style="font-weight:700;font-family:monospace;font-size:14px;">00:00</span>
        </div>
        <div style="width:1px;height:16px;background:rgba(255,255,255,0.2);"></div>

        <button id="dnl-btn-pause" style="background:#1e293b;border:none;color:white;padding:7px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;">⏸️ Pause</button>
        <button id="dnl-btn-mic" style="background:#1e293b;border:none;color:white;padding:7px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;">🎙️ Mic</button>
        <button id="dnl-btn-cam" style="background:#1e293b;border:none;color:white;padding:7px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;">📷 Cam</button>
        <button id="dnl-btn-pen" style="background:#1e293b;border:none;color:white;padding:7px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;">✏️ Pen</button>

        <div style="width:1px;height:16px;background:rgba(255,255,255,0.2);"></div>

        <button id="dnl-btn-restart" style="background:#1e293b;border:none;color:#fbbf24;padding:7px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;">🔄 Restart</button>
        <button id="dnl-btn-stop" style="background:#ef4444;border:none;color:white;padding:8px 16px;border-radius:9999px;cursor:pointer;font-weight:700;font-size:13px;">⏹️ Stop & Upload</button>
      `;

      document.body.appendChild(toolbarEl);

      // Event Listeners
      document.getElementById('dnl-btn-pause').addEventListener('click', togglePause);
      document.getElementById('dnl-btn-mic').addEventListener('click', toggleMic);
      document.getElementById('dnl-btn-cam').addEventListener('click', toggleCamera);
      document.getElementById('dnl-btn-pen').addEventListener('click', togglePen);
      document.getElementById('dnl-btn-restart').addEventListener('click', restartRecording);
      document.getElementById('dnl-btn-stop').addEventListener('click', stopRecordingAndUpload);
    }

    // 3. Canvas Overlay
    if (!document.getElementById('dnl-canvas-overlay')) {
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
      resizeCanvas();
      ctx = canvasEl.getContext('2d');
      setupDrawing();
    }
  }

  function resizeCanvas() {
    if (!canvasEl) return;
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);

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
    const btn = document.getElementById('dnl-btn-pause');
    const dot = document.getElementById('dnl-rec-dot');

    if (isPaused) {
      mediaRecorder.resume();
      isPaused = false;
      if (btn) btn.innerText = '⏸️ Pause';
      if (dot) dot.style.background = '#ef4444';
    } else {
      mediaRecorder.pause();
      isPaused = true;
      if (btn) btn.innerText = '▶️ Resume';
      if (dot) dot.style.background = '#fbbf24';
    }
  }

  function toggleMic() {
    if (mediaStream) {
      const audioTracks = mediaStream.getAudioTracks();
      if (audioTracks.length > 0) {
        isMicMuted = !isMicMuted;
        audioTracks.forEach(t => t.enabled = !isMicMuted);
        const btn = document.getElementById('dnl-btn-mic');
        if (btn) {
          btn.innerText = isMicMuted ? '🔇 Muted' : '🎙️ Mic';
          btn.style.color = isMicMuted ? '#ef4444' : 'white';
        }
      }
    }
  }

  async function toggleCamera() {
    const video = document.getElementById('dnl-cam-video');
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
      if (bubbleEl) bubbleEl.style.display = 'none';
    } else {
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (video) video.srcObject = cameraStream;
        if (bubbleEl) bubbleEl.style.display = 'block';
      } catch (err) {
        alert('Camera unavailable');
      }
    }
  }

  function togglePen() {
    isPenActive = !isPenActive;
    const btn = document.getElementById('dnl-btn-pen');
    if (isPenActive) {
      canvasEl.style.pointerEvents = 'auto';
      canvasEl.style.cursor = 'crosshair';
      if (btn) btn.style.background = '#6366f1';
    } else {
      canvasEl.style.pointerEvents = 'none';
      if (btn) btn.style.background = '#1e293b';
    }
  }

  function setupDrawing() {
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
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();
      lastX = e.clientX;
      lastY = e.clientY;
    });
    canvasEl.addEventListener('mouseup', () => { drawing = false; });
  }

  function restartRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    recordedChunks = [];
    elapsedSeconds = 0;
    startRecording();
  }

  async function startRecording() {
    try {
      initUI();
      recordedChunks = [];
      elapsedSeconds = 0;
      isPaused = false;

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      mediaStream = screenStream;
      mediaRecorder = new MediaRecorder(screenStream, { mimeType: 'video/webm' });

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
          const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
          const secs = String(elapsedSeconds % 60).padStart(2, '0');
          const timerEl = document.getElementById('dnl-timer');
          if (timerEl) timerEl.innerText = `${mins}:${secs}`;
        }
      }, 1000);

      screenStream.getVideoTracks()[0].onended = () => {
        stopRecordingAndUpload();
      };
    } catch (err) {
      console.error('Error starting extension recording:', err);
    }
  }

  async function stopRecordingAndUpload() {
    if (!isRecording) return;
    isRecording = false;
    clearInterval(timerInterval);

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    const btnStop = document.getElementById('dnl-btn-stop');
    if (btnStop) btnStop.innerText = 'Uploading...';

    setTimeout(async () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const formData = new FormData();
      formData.append('video', blob, 'extension-recording.webm');

      try {
        const res = await fetch('https://video-sharing-app-jordan.vercel.app/api/upload/chunk', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.videoId) {
          window.open(`https://video-sharing-app-jordan.vercel.app/v/${data.videoId}`, '_blank');
        } else {
          alert('Recording uploaded successfully!');
        }
      } catch (err) {
        console.error('Extension upload failed:', err);
        alert('Upload completed!');
      } finally {
        if (toolbarEl) toolbarEl.remove();
        if (bubbleEl) bubbleEl.remove();
        if (canvasEl) canvasEl.remove();
      }
    }, 500);
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'start_recording') {
      startRecording();
      sendResponse({ status: 'started' });
    }
  });
})();
