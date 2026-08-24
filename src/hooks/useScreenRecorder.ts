'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface RecorderOptions {
  includeMic: boolean;
  includeCamera: boolean;
  cameraShape: 'circle' | 'square';
  cameraSize: 'sm' | 'md' | 'lg';
  onChunkAvailable?: (chunk: Blob) => void;
}

export interface LiveTranscriptItem {
  id: string;
  start: number;
  end: number;
  text: string;
  isFiller?: boolean;
}

export function useScreenRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimeRef = useRef(0);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  // Live Speech Recognition Transcript
  const [liveTranscript, setLiveTranscript] = useState<LiveTranscriptItem[]>([]);
  const recognitionRef = useRef<any>(null);
  const speechSegmentStartRef = useRef<number>(0);
  const currentInterimTextRef = useRef<string>('');

  // Mute / camera toggles
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Bubble position state
  const bubblePosRef = useRef({ x: 50, y: 50 });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clear timer
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        const next = prev + 1;
        recordingTimeRef.current = next;
        return next;
      });
    }, 1000);
  };

  // Start capture
  const startRecording = useCallback(async (options: RecorderOptions) => {
    try {
      setErrorMessage(null);
      setRecordedChunks([]);
      setLiveTranscript([]);
      setPreviewUrl(null);
      setRecordedBlob(null);
      recordingTimeRef.current = 0;
      speechSegmentStartRef.current = 0;
      currentInterimTextRef.current = '';
      isRecordingRef.current = true;

      // 1. Get Screen Stream (with fallback for system audio & Electron desktop app)
      let screen: MediaStream;
      try {
        screen = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      } catch (err) {
        console.warn('System audio getDisplayMedia fallback to video-only:', err);
        try {
          screen = await navigator.mediaDevices.getDisplayMedia({
            video: true,
          });
        } catch (err2) {
          // Electron Desktop Capturer Fallback
          if (typeof window !== 'undefined' && (window as any).electronAPI) {
            const sources = await (window as any).electronAPI.getDesktopSources();
            if (sources && sources.length > 0) {
              const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                  mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: sources[0].id,
                  },
                } as any,
              });
              screen = stream;
            } else {
              throw err2;
            }
          } else {
            throw err2;
          }
        }
      }
      setScreenStream(screen);

      // 2. Get Camera Stream if selected
      let camera: MediaStream | null = null;
      if (options.includeCamera) {
        try {
          camera = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 640 }, frameRate: { ideal: 30 } },
          });
          setCameraStream(camera);
        } catch (err) {
          console.warn('Camera access denied or unavailable', err);
        }
      }

      // 3. Get Mic Stream if selected
      let mic: MediaStream | null = null;
      if (options.includeMic) {
        try {
          mic = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          setMicStream(mic);
        } catch (err) {
          console.warn('Microphone access denied or unavailable', err);
        }
      }

      // 3b. Start Speech Recognition for real-time accurate transcripts
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition && options.includeMic) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            const currentTimeSec = recordingTimeRef.current;
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const transcriptText = event.results[i][0].transcript.trim();
              if (event.results[i].isFinal && transcriptText.length > 0) {
                const startSec = speechSegmentStartRef.current;
                const endSec = Math.max(startSec + 1, currentTimeSec);
                const isFiller = /\b(um|uh|hmm|ah|like|you know)\b/i.test(transcriptText);

                setLiveTranscript((prev) => [
                  ...prev,
                  {
                    id: `seg-${Date.now()}-${Math.random()}`,
                    start: startSec,
                    end: endSec,
                    text: transcriptText,
                    isFiller,
                  },
                ]);
                speechSegmentStartRef.current = currentTimeSec;
                currentInterimTextRef.current = '';
              } else {
                currentInterimTextRef.current = transcriptText;
              }
            }
          };

          // Auto restart if browser stops recognition while recording is active
          recognition.onend = () => {
            if (isRecordingRef.current) {
              try {
                recognition.start();
              } catch (e) {}
            }
          };

          recognition.onerror = (event: any) => {
            console.warn('Speech recognition error:', event.error);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn('Speech recognition start failed:', e);
        }
      }

      // 4. Mix Audio Streams with AudioContext using Master Gain
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const audioDestination = audioCtx.createMediaStreamDestination();
      const masterGain = audioCtx.createGain();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;

      masterGain.connect(audioDestination);
      masterGain.connect(analyser);
      analyserRef.current = analyser;

      const mixedAudioTracks: MediaStreamTrack[] = [];

      // Mix System Audio if present
      const sysTracks = screen.getAudioTracks();
      if (sysTracks.length > 0) {
        try {
          const sysSource = audioCtx.createMediaStreamSource(new MediaStream([sysTracks[0]]));
          sysSource.connect(masterGain);
        } catch (e) {
          console.warn('System audio mixing warning:', e);
          mixedAudioTracks.push(sysTracks[0]);
        }
      }

      // Mix Mic Audio if present
      if (mic) {
        const micTracks = mic.getAudioTracks();
        if (micTracks.length > 0) {
          try {
            const micSource = audioCtx.createMediaStreamSource(new MediaStream([micTracks[0]]));
            micSource.connect(masterGain);
          } catch (e) {
            console.warn('Mic audio mixing warning:', e);
            mixedAudioTracks.push(micTracks[0]);
          }
        }
      }

      // Final Audio Track Selection
      const destAudioTracks = audioDestination.stream.getAudioTracks();
      const finalAudioTracks = destAudioTracks.length > 0 ? destAudioTracks : mixedAudioTracks;

      // 5. Canvas Compositing Engine
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      canvasRef.current = canvas;
      const ctx = canvas.getContext('2d')!;

      const screenVideo = document.createElement('video');
      screenVideo.srcObject = screen;
      screenVideo.muted = true;
      await screenVideo.play();

      let cameraVideo: HTMLVideoElement | null = null;
      if (camera) {
        cameraVideo = document.createElement('video');
        cameraVideo.srcObject = camera;
        cameraVideo.muted = true;
        await cameraVideo.play();
      }

      const audioDataArray = new Uint8Array(analyser.frequencyBinCount);

      // Draw Loop
      const drawFrame = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Measure Audio Level
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(audioDataArray);
          const sum = audioDataArray.reduce((acc, val) => acc + val, 0);
          const avg = sum / audioDataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        }

        // Draw Screen
        if (screenVideo.readyState >= 2) {
          ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
        }

        // Draw Camera Bubble
        if (cameraVideo && cameraVideo.readyState >= 2 && !isCameraOff) {
          ctx.save();
          const bubbleSize = options.cameraSize === 'sm' ? 180 : options.cameraSize === 'md' ? 240 : 300;
          const { x, y } = bubblePosRef.current;

          ctx.beginPath();
          if (options.cameraShape === 'circle') {
            ctx.arc(x + bubbleSize / 2, y + bubbleSize / 2, bubbleSize / 2, 0, Math.PI * 2);
          } else {
            ctx.roundRect(x, y, bubbleSize, bubbleSize, 20);
          }
          ctx.clip();

          ctx.drawImage(cameraVideo, x, y, bubbleSize, bubbleSize);
          ctx.restore();

          ctx.save();
          ctx.beginPath();
          if (options.cameraShape === 'circle') {
            ctx.arc(x + bubbleSize / 2, y + bubbleSize / 2, bubbleSize / 2 + 3, 0, Math.PI * 2);
          } else {
            ctx.roundRect(x - 3, y - 3, bubbleSize + 6, bubbleSize + 6, 22);
          }
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.restore();
        }

        animationFrameRef.current = requestAnimationFrame(drawFrame);
      };

      drawFrame();

      // 6. Combine Composited Canvas Video Stream + Mixed Audio Destination
      const compositedVideoStream = canvas.captureStream(60);
      const combinedTracks = [
        ...compositedVideoStream.getVideoTracks(),
        ...finalAudioTracks,
      ];
      const finalStream = new MediaStream(combinedTracks);

      // 7. Setup MediaRecorder
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }

      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond: 4500000,
      });

      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
          setRecordedChunks((prev) => [...prev, e.data]);
          if (options.onChunkAvailable) {
            options.onChunkAvailable(e.data);
          }
        }
      };

      mediaRecorder.onstop = () => {
        const fullBlob = new Blob(chunks, { type: mimeType });
        setRecordedBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setPreviewUrl(url);
      };

      screen.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      startTimer();
    } catch (err: unknown) {
      console.error('Error starting recording:', err);
      const msg = err instanceof Error ? err.message : 'Permission denied or capture failed';
      setErrorMessage(msg);
      isRecordingRef.current = false;
    }
  }, []);

  // Pause
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  }, []);

  // Resume
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  }, []);

  // Stop Recording
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Flush any pending interim speech text into transcript
    if (currentInterimTextRef.current.trim().length > 0) {
      const text = currentInterimTextRef.current.trim();
      const startSec = speechSegmentStartRef.current;
      const endSec = Math.max(startSec + 1, recordingTimeRef.current);
      const isFiller = /\b(um|uh|hmm|ah|like|you know)\b/i.test(text);

      setLiveTranscript((prev) => [
        ...prev,
        {
          id: `seg-${Date.now()}-${Math.random()}`,
          start: startSec,
          end: endSec,
          text,
          isFiller,
        },
      ]);
      currentInterimTextRef.current = '';
    }

    setIsRecording(false);
    setIsPaused(false);
    stopTimer();

    // Stop tracks & cleanup
    if (screenStream) screenStream.getTracks().forEach((t) => t.stop());
    if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
    if (micStream) micStream.getTracks().forEach((t) => t.stop());
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
  }, [screenStream, cameraStream, micStream]);

  // Restart Recording
  const restartRecording = useCallback(async (options: RecorderOptions) => {
    stopRecording();
    setTimeout(() => {
      startRecording(options);
    }, 300);
  }, [stopRecording, startRecording]);

  // Reset Recorder State
  const resetRecorder = useCallback(() => {
    stopRecording();
    setRecordedChunks([]);
    setLiveTranscript([]);
    setPreviewUrl(null);
    setRecordedBlob(null);
    setRecordingTime(0);
  }, [stopRecording]);

  // Toggle Mute Mic
  const toggleMuteMic = useCallback(() => {
    if (micStream) {
      micStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMicMuted((prev) => !prev);
    }
  }, [micStream]);

  // Toggle Camera
  const toggleCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      stopTimer();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return {
    cameraStream,
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
    setBubblePosition: (x: number, y: number) => {
      bubblePosRef.current = { x, y };
    },
  };
}
