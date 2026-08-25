'use client';

import React, { useState, useEffect } from 'react';
import { useScreenRecorder } from '@/hooks/useScreenRecorder';
import { CameraBubble } from './CameraBubble';
import { AnnotationCanvas } from './AnnotationCanvas';
import {
  Video,
  Monitor,
  Play,
  Pause,
  RotateCcw,
  Square,
  Download,
  Share2,
  RefreshCw,
  Pencil,
  CheckCircle2,
  Puzzle,
  Radio,
} from 'lucide-react';

export function StudioRecorder() {
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [isExtensionRecording, setIsExtensionRecording] = useState(false);
  const [liveFrameUrl, setLiveFrameUrl] = useState<string | null>(null);

  const {
    cameraStream,
    isRecording,
    isPaused,
    recordingTime,
    previewUrl,
    recordedBlob,
    liveTranscript,
    isCameraOff,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecorder,
    toggleCamera,
    setBubblePosition,
  } = useScreenRecorder();

  // Listen for cross-tab and cross-origin Extension recording start/stop events & live video frames
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'RECORDING_STARTED') {
        setIsExtensionRecording(true);
      } else if (event.data?.type === 'RECORDING_STOPPED' || event.data?.type === 'NEW_VIDEO') {
        setIsExtensionRecording(false);
        setLiveFrameUrl(null);
      } else if (event.data?.type === 'LIVE_FRAME' && event.data?.frame) {
        setIsExtensionRecording(true);
        setLiveFrameUrl(event.data.frame);
      }
    };
    window.addEventListener('message', handleMessage);

    const channel = new BroadcastChannel('dnl_video_sync');
    channel.onmessage = (event) => {
      if (event.data?.type === 'RECORDING_STARTED') {
        setIsExtensionRecording(true);
      } else if (event.data?.type === 'RECORDING_STOPPED' || event.data?.type === 'NEW_VIDEO') {
        setIsExtensionRecording(false);
        setLiveFrameUrl(null);
      }
    };

    return () => {
      window.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, []);

  const activeRecording = isRecording || isExtensionRecording;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `my-recording-${Date.now()}.webm`;
    a.click();
  };

  const handleSimulatedUpload = async () => {
    if (!recordedBlob) return;
    setIsUploading(true);

    const CHUNK_SIZE = 2 * 1024 * 1024;
    const totalChunks = Math.ceil(recordedBlob.size / CHUNK_SIZE);
    const uploadId = `up-${Date.now()}`;
    const videoId = `vid-${Date.now()}`;

    try {
      let data = null;

      if (totalChunks <= 1) {
        const formData = new FormData();
        formData.append('video', recordedBlob, 'recording.webm');
        formData.append('videoId', videoId);
        if (liveTranscript.length > 0) {
          formData.append('transcript', JSON.stringify(liveTranscript));
        }

        const res = await fetch('/api/upload/chunk', {
          method: 'POST',
          body: formData,
        });
        data = await res.json();
      } else {
        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(recordedBlob.size, start + CHUNK_SIZE);
          const chunkSlice = recordedBlob.slice(start, end);

          const formData = new FormData();
          formData.append('chunk', chunkSlice, `chunk-${i}.part`);
          formData.append('uploadId', uploadId);
          formData.append('chunkIndex', i.toString());
          formData.append('totalChunks', totalChunks.toString());
          formData.append('videoId', videoId);
          if (i === totalChunks - 1 && liveTranscript.length > 0) {
            formData.append('transcript', JSON.stringify(liveTranscript));
          }

          const res = await fetch('/api/upload/chunk', {
            method: 'POST',
            body: formData,
          });
          data = await res.json();
        }
      }

      if (data && data.videoId) {
        setUploadedVideoId(data.videoId);
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (recordedBlob && !uploadedVideoId && !isUploading) {
      handleSimulatedUpload();
    }
  }, [recordedBlob]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-6">
      {/* Studio Top Action Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <p className="text-zinc-400 text-xs font-medium">
          Record your screen, speak your mind, and share your video in seconds.
        </p>

        <div className="flex items-center gap-2">
          <a
            href="/api/download-extension"
            download
            className="text-xs bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-lg"
            title="Download Chrome Extension (.zip)"
          >
            <Puzzle size={16} /> Get Browser Extension
          </a>
        </div>
      </div>

      {/* BIG WIDESCREEN LIVE RECORDING MONITOR (Front & Center) */}
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-3">
            <span className={`w-3.5 h-3.5 rounded-full ${activeRecording ? 'bg-red-500 animate-ping' : 'bg-yellow-400'}`} />
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Monitor className="text-yellow-400" size={24} /> Live Screen Monitor
            </h2>
            {activeRecording ? (
              <span className="text-xs bg-red-500/20 text-red-400 font-extrabold px-3 py-1 rounded-full border border-red-500/40 flex items-center gap-1.5">
                <Radio size={14} className="animate-pulse text-red-500" /> LIVE STREAMING • {formatTime(recordingTime)}
              </span>
            ) : (
              <span className="text-xs bg-yellow-400/10 text-yellow-400 font-bold px-3 py-1 rounded-full border border-yellow-400/30">
                Ready to Record
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-400 font-mono">
            60fps HD • Live Stream
          </div>
        </div>

        {/* Widescreen Display Projection Container */}
        <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden border border-zinc-800 relative shadow-2xl flex items-center justify-center">
          {activeRecording ? (
            cameraStream ? (
              <video
                ref={(vid) => {
                  if (vid && cameraStream) {
                    vid.srcObject = cameraStream;
                    vid.play().catch(() => {});
                  }
                }}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            ) : liveFrameUrl ? (
              <img src={liveFrameUrl} alt="Live Screen Stream" className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-gradient-to-b from-red-950/40 via-zinc-900 to-black">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-3xl animate-ping absolute inset-0" />
                  <div className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center text-2xl shadow-xl relative font-bold">
                    🔴
                  </div>
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h3 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                    Live Broadcast Active
                  </h3>
                  <p className="text-xs text-yellow-300 font-mono">
                    Recording live across browser tabs • 60fps HD
                  </p>
                </div>
              </div>
            )
          ) : previewUrl ? (
            <video src={previewUrl} controls className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-gradient-to-b from-zinc-900/60 to-black">
              <div className="w-20 h-20 rounded-3xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 flex items-center justify-center text-4xl shadow-xl animate-bounce">
                😉
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Your screen is ready!
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Click your <span className="text-yellow-400 font-bold">😉 extension icon</span> in your browser toolbar to start recording. We'll show your live preview right here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Extension Installation & Usage Instructions */}
      {!activeRecording && !previewUrl && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-black flex items-center justify-center font-extrabold text-2xl shrink-0 shadow-lg">
              🚀
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Get recording in under 30 seconds
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Follow these 3 simple steps to add the browser extension and share your thoughts visually.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Step 1 */}
            <div className="bg-black/80 p-5 rounded-2xl border border-zinc-800 space-y-2">
              <div className="font-extrabold text-yellow-400 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black text-xs">1</span>
                Grab the extension
              </div>
              <p className="text-zinc-300 leading-relaxed">
                Click <strong>Get Browser Extension</strong> above & unzip the folder. Open <code className="bg-zinc-800 text-yellow-300 px-1.5 py-0.5 rounded font-mono">chrome://extensions</code>, turn on <strong>Developer mode</strong>, click <strong>Load unpacked</strong>, and select the folder.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-black/80 p-5 rounded-2xl border border-zinc-800 space-y-2">
              <div className="font-extrabold text-yellow-400 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black text-xs">2</span>
                Pick what to share
              </div>
              <p className="text-zinc-300 leading-relaxed">
                Click the <strong>😉 icon</strong> in your browser toolbar on any tab (Gmail, Docs, GitHub). Record your full screen, a window, or a single tab.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-black/80 p-5 rounded-2xl border border-zinc-800 space-y-2">
              <div className="font-extrabold text-yellow-400 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black text-xs">3</span>
                Share & relax
              </div>
              <p className="text-zinc-300 leading-relaxed">
                When you're done, hit the green checkmark! We'll auto-generate a shareable link, transcript, and AI summary instantly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Speech Caption Ticker during Active Recording */}
      {isRecording && liveTranscript.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black/90 border border-yellow-400/30 text-yellow-300 px-6 py-2.5 rounded-2xl shadow-xl backdrop-blur-md text-xs font-mono max-w-xl truncate z-50 flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="truncate">Transcribing: "{liveTranscript[liveTranscript.length - 1].text}"</span>
        </div>
      )}

      {/* Right Vertical Control Dock (Loom Style on RIGHT SIDE) */}
      {isRecording && (
        <div className="fixed top-1/2 -translate-y-1/2 right-4 bg-zinc-900/95 border border-zinc-700/60 text-white p-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col items-center gap-3 z-50">
          <div className="font-mono text-xs font-bold text-yellow-400 bg-yellow-400/15 px-2 py-1 rounded-md">
            {formatTime(recordingTime)}
          </div>
          <button
            onClick={isPaused ? resumeRecording : pauseRecording}
            className="w-9 h-9 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex items-center justify-center text-white transition"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            onClick={toggleCamera}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${isCameraOff ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 hover:bg-zinc-700 text-yellow-400'}`}
            title="Toggle Camera"
          >
            <Video size={16} />
          </button>
          <button
            onClick={() => setIsAnnotating(!isAnnotating)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${isAnnotating ? 'bg-yellow-400 text-black font-bold' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}
            title="Draw on screen"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={resetRecorder}
            className="w-9 h-9 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex items-center justify-center text-red-400 transition"
            title="Start over"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={stopRecording}
            className="w-10 h-10 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold rounded-xl flex items-center justify-center transition shadow-lg shadow-emerald-500/30 text-lg"
            title="Done recording!"
          >
            ✓
          </button>
        </div>
      )}

      {/* Camera Bubble Preview overlay (LEFT SIDE) */}
      {isRecording && (
        <CameraBubble
          stream={cameraStream}
          shape="circle"
          size="md"
          isOff={isCameraOff}
          onToggleOff={toggleCamera}
          onPositionChange={setBubblePosition}
        />
      )}

      {/* Live Screen Annotation Canvas */}
      <AnnotationCanvas active={isAnnotating} onClose={() => setIsAnnotating(false)} />

      {/* Recording Complete Actions (When preview is ready) */}
      {previewUrl && !activeRecording && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400" size={22} /> That's a wrap!
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Your video is ready to preview on the monitor above.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={resetRecorder}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-yellow-400 text-sm font-semibold rounded-xl transition flex items-center gap-2 border border-zinc-700"
                title="Discard preview and record again"
              >
                <RotateCcw size={16} /> Record Again
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2 border border-zinc-700"
              >
                <Download size={16} /> Save .webm
              </button>
              <button
                onClick={handleSimulatedUpload}
                disabled={isUploading}
                className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold disabled:opacity-50 text-sm rounded-xl transition flex items-center gap-2 shadow-lg"
              >
                {isUploading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Generating Link...
                  </>
                ) : (
                  <>
                    <Share2 size={16} /> Get Shareable Link
                  </>
                )}
              </button>
            </div>
          </div>

          {uploadedVideoId && (
            <div className="bg-yellow-400/10 border border-yellow-400/30 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-yellow-400 font-bold">✨ Shareable video link is ready!</div>
                <div className="text-xs text-zinc-400 font-mono mt-0.5">
                  {typeof window !== 'undefined' ? `${window.location.origin}/v/${uploadedVideoId}` : `/v/${uploadedVideoId}`}
                </div>
              </div>
              <a
                href={`/v/${uploadedVideoId}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs rounded-xl transition"
              >
                Watch Video Page →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
