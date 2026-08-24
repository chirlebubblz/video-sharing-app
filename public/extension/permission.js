document.getElementById('btn-grant').addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach((t) => t.stop());
    document.getElementById('btn-grant').style.display = 'none';
    document.getElementById('status-success').style.display = 'block';
    setTimeout(() => {
      window.close();
    }, 1200);
  } catch (err) {
    alert('Permission denied. Please allow camera & microphone access in your browser address bar.');
  }
});
