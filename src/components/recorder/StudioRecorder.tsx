'use client';

import React, { useState } from 'react';
import { useScreenRecorder } from '@/hooks/useScreenRecorder';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { CameraBubble } from './CameraBubble';
import { AnnotationCanvas } from './AnnotationCanvas';
import {
  Video,
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Sparkles,
  Pencil,
  Download,
  Share2,
  Settings,
  Circle,
  Square as SquareIcon,
  Monitor,
  Layout,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  VideoOff,
  Volume2,
  RotateCcw,
} from 'lucide-react';

export function StudioRecorder() {
  const [includeMic, setIncludeMic] = useState(true);
  const [includeCamera, setIncludeCamera] = useState(true);
  const [cameraShape, setCameraShape] = useState<'circle' | 'square'>('circle');
  const [cameraSize, setCameraSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);

  const { hasCamera, hasMic, cameras, microphones, refreshDevices } = useMediaDevices();
  const {
    isRecording,
    isPaused,
    recordingTime,
    previewUrl,
    recordedBlob,
    recordedChunks,
    liveTranscript,
    isMicMuted,
    isCameraOff,
    audioLevel,
    errorMessage,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    restartRecording,
    resetRecorder,
    toggleMuteMic,
    toggleCamera,
    setBubblePosition,
  } = useScreenRecorder();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    startRecording({
      includeMic,
      includeCamera,
      cameraShape,
      cameraSize,
    });
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `definitely-not-loom-${Date.now()}.webm`;
    a.click();
  };

  const handleSimulatedUpload = async () => {
    if (!recordedBlob) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', recordedBlob, 'recording.webm');
      if (liveTranscript.length > 0) {
        formData.append('transcript', JSON.stringify(liveTranscript));
      }
      
      const res = await fetch('/api/upload/chunk', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.videoId) {
        setUploadedVideoId(data.videoId);
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Auto-upload as soon as recording finishes
  React.useEffect(() => {
    if (recordedBlob && !uploadedVideoId && !isUploading) {
      handleSimulatedUpload();
    }
  }, [recordedBlob]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Studio Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
              DefinitelyNotLoom Studio
            </span>
            <span className="text-xs bg-indigo-500/20 text-indigo-400 font-semibold px-2.5 py-1 rounded-full border border-indigo-500/30">
              HD 60fps
            </span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Record screen, camera, and mixed audio with real-time chunk streaming & AI transcription ready.
          </p>
        </div>

        {isRecording && (
          <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 px-4 py-2 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 pulsate" />
              <span className="font-mono text-lg font-bold text-red-500">
                {formatTime(recordingTime)}
              </span>
            </div>
            <div className="h-4 w-px bg-gray-800" />
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="p-2 hover:bg-gray-800 rounded-lg text-gray-300 transition"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button
              onClick={() => restartRecording({ includeMic, includeCamera, cameraShape, cameraSize })}
              className="p-2 hover:bg-gray-800 rounded-lg text-gray-300 transition hover:text-amber-400"
              title="Restart Recording"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={stopRecording}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition flex items-center gap-1.5"
            >
              <Square size={14} /> Stop
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!isRecording && !previewUrl && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Config Panel */}
          <div className="md:col-span-2 bg-gray-900/60 border border-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Monitor className="text-indigo-400" size={20} /> Capture Settings
              </h2>

              {/* Hardware Device Health Badge */}
              <div className="flex items-center gap-3 bg-gray-950/80 px-3 py-1.5 rounded-xl border border-gray-800 text-xs">
                <div className="flex items-center gap-1.5">
                  {hasCamera ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold" title={cameras[0]?.label || 'Camera Connected'}>
                      <Video size={12} /> Cam Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400 font-semibold" title="No Camera Detected">
                      <VideoOff size={12} /> No Cam
                    </span>
                  )}
                </div>
                <div className="h-3 w-px bg-gray-800" />
                <div className="flex items-center gap-1.5">
                  {hasMic ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold" title={microphones[0]?.label || 'Microphone Connected'}>
                      <Mic size={12} /> Mic Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 font-semibold" title="No Microphone Detected">
                      <MicOff size={12} /> No Mic
                    </span>
                  )}
                </div>
                <button
                  onClick={refreshDevices}
                  className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition"
                  title="Rescan hardware devices"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setIncludeCamera(true);
                }}
                className={`p-4 rounded-2xl border text-left transition ${
                  includeCamera
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-gray-800 bg-gray-950/50 text-gray-400 hover:border-gray-700'
                }`}
              >
                <Video size={24} className={includeCamera ? 'text-indigo-400 mb-2' : 'mb-2'} />
                <div className="font-semibold text-sm">Screen + Cam</div>
                <div className="text-xs text-gray-400 mt-0.5">Recommended</div>
              </button>

              <button
                onClick={() => setIncludeCamera(false)}
                className={`p-4 rounded-2xl border text-left transition ${
                  !includeCamera
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-gray-800 bg-gray-950/50 text-gray-400 hover:border-gray-700'
                }`}
              >
                <Monitor size={24} className={!includeCamera ? 'text-indigo-400 mb-2' : 'mb-2'} />
                <div className="font-semibold text-sm">Screen Only</div>
                <div className="text-xs text-gray-400 mt-0.5">Desktop or Tab</div>
              </button>

              <button
                onClick={() => setIncludeMic(!includeMic)}
                className={`p-4 rounded-2xl border text-left transition ${
                  includeMic
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-gray-800 bg-gray-950/50 text-gray-400 hover:border-gray-700'
                }`}
              >
                {includeMic ? (
                  <Mic size={24} className="text-emerald-400 mb-2" />
                ) : (
                  <MicOff size={24} className="text-gray-500 mb-2" />
                )}
                <div className="font-semibold text-sm">Mic Audio</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {includeMic ? 'Noise Reduced' : 'Muted'}
                </div>
              </button>
            </div>

            {/* Camera Bubble Controls */}
            {includeCamera && (
              <div className="border-t border-gray-800 pt-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Layout size={16} className="text-indigo-400" /> Camera Overlay Style
                </h3>
                <div className="flex items-center gap-6">
                  {/* Shape */}
                  <div className="flex items-center gap-2 bg-gray-950/80 p-1.5 rounded-xl border border-gray-800">
                    <button
                      onClick={() => setCameraShape('circle')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        cameraShape === 'circle'
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Circle size={14} /> Circle
                    </button>
                    <button
                      onClick={() => setCameraShape('square')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        cameraShape === 'square'
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <SquareIcon size={14} /> Square
                    </button>
                  </div>

                  {/* Size */}
                  <div className="flex items-center gap-2 bg-gray-950/80 p-1.5 rounded-xl border border-gray-800">
                    {(['sm', 'md', 'lg'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setCameraSize(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition ${
                          cameraSize === s
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error Alert Banner */}
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-semibold">
                <AlertCircle size={18} className="shrink-0" />
                <div>
                  <div className="font-bold">Screen / Media Capture Notice</div>
                  <div className="text-[11px] opacity-80 mt-0.5">{errorMessage}</div>
                </div>
              </div>
            )}

            {/* Start Button */}
            <div className="border-t border-gray-800 pt-6">
              <button
                onClick={handleStart}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-indigo-500/25 transition duration-200 flex items-center justify-center gap-3 text-lg"
              >
                <Video size={24} /> Start Recording
              </button>
            </div>
          </div>

          {/* Quick AI & Pro Features Info */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Sparkles size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">AI-Powered Loom Clone</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                As soon as you stop recording, our engine generates instant transcriptions, executive summaries, AI chapter markers, and interactive comment overlays.
              </p>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Instant chunked video upload
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Word-level timestamped transcripts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Edit video by editing transcript text
                </li>
              </ul>
            </div>
            <div className="text-xs text-gray-500 border-t border-gray-800 pt-4">
              Supports Chrome, Edge, Brave, and Firefox desktop browsers.
            </div>
          </div>
        </div>
      )}

      {/* Floating Live Speech Caption Ticker during Active Recording */}
      {isRecording && liveTranscript.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black/85 border border-indigo-500/30 text-indigo-300 px-5 py-2 rounded-2xl shadow-xl backdrop-blur-md text-xs font-mono max-w-lg truncate z-50 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="truncate">Live Speech: "{liveTranscript[liveTranscript.length - 1].text}"</span>
        </div>
      )}

      {/* Floating Canvas Controls during Active Recording */}
      {isRecording && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/90 border border-gray-800 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-xl flex items-center space-x-6 z-50">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMuteMic}
              className={`p-3 rounded-full transition ${isMicMuted ? 'bg-red-600/30 text-red-400' : 'bg-gray-800 hover:bg-gray-700'}`}
              title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            {/* Live VU Audio Level Meter */}
            {!isMicMuted && (
              <div className="flex items-end gap-0.5 h-6 w-5 bg-gray-950 p-1 rounded-md border border-gray-800" title={`Live Mic Volume: ${audioLevel}%`}>
                <div
                  style={{ height: `${Math.max(15, audioLevel)}%` }}
                  className={`w-full rounded-sm transition-all duration-75 ${
                    audioLevel > 60 ? 'bg-red-500' : audioLevel > 20 ? 'bg-emerald-400' : 'bg-indigo-400'
                  }`}
                />
              </div>
            )}
          </div>

          <button
            onClick={toggleCamera}
            className={`p-3 rounded-full transition ${isCameraOff ? 'bg-red-600/30 text-red-400' : 'bg-gray-800 hover:bg-gray-700'}`}
            title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            <Video size={20} />
          </button>

          <button
            onClick={() => setIsAnnotating(!isAnnotating)}
            className={`p-3 rounded-full transition ${isAnnotating ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
            title="Toggle Live Draw & Annotate"
          >
            <Pencil size={20} />
          </button>

          <div className="h-6 w-px bg-gray-800" />

          <button
            onClick={stopRecording}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition flex items-center gap-2 shadow-lg"
          >
            <Square size={16} /> Finish Recording
          </button>
        </div>
      )}

      {/* Camera Bubble Preview overlay */}
      {isRecording && includeCamera && (
        <CameraBubble
          stream={null} // Composited inside hook
          shape={cameraShape}
          size={cameraSize}
          isOff={isCameraOff}
          onToggleOff={toggleCamera}
          onPositionChange={setBubblePosition}
        />
      )}

      {/* Live Screen Annotation Canvas */}
      <AnnotationCanvas active={isAnnotating} onClose={() => setIsAnnotating(false)} />

      {/* Recording Complete & Instant Preview Player */}
      {previewUrl && !isRecording && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400" size={22} /> Recording Ready!
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Your video was recorded and composited in real time.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={resetRecorder}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-amber-400 text-sm font-semibold rounded-xl transition flex items-center gap-2 border border-gray-700"
                title="Discard preview and record again"
              >
                <RotateCcw size={16} /> Record Again
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2 border border-gray-700"
              >
                <Download size={16} /> Download .webm
              </button>
              <button
                onClick={handleSimulatedUpload}
                disabled={isUploading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2 shadow-lg"
              >
                {isUploading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Processing AI...
                  </>
                ) : (
                  <>
                    <Share2 size={16} /> Upload & Get Share Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Player Container */}
          <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative">
            <video src={previewUrl} controls className="w-full h-full object-contain" />
          </div>

          {uploadedVideoId && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-indigo-400">Shareable Video Page Ready</div>
                <div className="text-xs text-gray-400 font-mono mt-0.5">
                  {typeof window !== 'undefined' ? `${window.location.origin}/v/${uploadedVideoId}` : `/v/${uploadedVideoId}`}
                </div>
              </div>
              <a
                href={`/v/${uploadedVideoId}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition"
              >
                Open Video Player Page →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
