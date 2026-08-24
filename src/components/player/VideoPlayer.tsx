'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  RotateCw,
  Sparkles,
  Bookmark,
} from 'lucide-react';

interface Chapter {
  time: number;
  title: string;
}

interface VideoPlayerProps {
  src: string;
  chapters?: Chapter[];
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onSeek: (time: number) => void;
}

export function VideoPlayer({
  src,
  chapters = [],
  currentTime,
  onTimeUpdate,
  onSeek,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 32.0);
    };

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [onTimeUpdate]);

  // Sync seek externally
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    onSeek(time);
  };

  const skipSeconds = (secs: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + secs));
      videoRef.current.currentTime = newTime;
      onSeek(newTime);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl group border border-gray-800"
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        playsInline
      />

      {/* Control Bar Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col gap-2">
        {/* Seek Bar with Chapter Markers */}
        <div className="relative w-full flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 32}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            className="w-full h-1.5 bg-gray-700/80 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
          />

          {/* Chapter Markers on Progress Bar */}
          {chapters.map((ch, idx) => {
            const pct = (ch.time / (duration || 32)) * 100;
            return (
              <div
                key={idx}
                style={{ left: `${pct}%` }}
                className="absolute top-0 w-1 h-3 bg-indigo-400 rounded-full shadow-lg group/marker cursor-pointer"
                title={`${ch.title} (${formatTime(ch.time)})`}
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime = ch.time;
                  onSeek(ch.time);
                }}
              />
            );
          })}
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white text-sm">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="hover:text-indigo-400 transition">
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <button onClick={() => skipSeconds(-5)} className="hover:text-indigo-400 transition" title="Back 5s">
              <RotateCcw size={18} />
            </button>
            <button onClick={() => skipSeconds(5)} className="hover:text-indigo-400 transition" title="Forward 5s">
              <RotateCw size={18} />
            </button>

            <div className="flex items-center gap-2 group/vol">
              <button onClick={toggleMute} className="hover:text-indigo-400 transition">
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <span className="font-mono text-xs text-gray-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 bg-gray-800/80 hover:bg-gray-700 rounded-lg text-xs font-semibold font-mono text-gray-200 border border-gray-700 transition"
              >
                {playbackSpeed}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-8 right-0 bg-gray-900 border border-gray-700 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 z-20">
                  {[0.5, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeedChange(s)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono text-left transition ${
                        playbackSpeed === s ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-gray-800 text-gray-300'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={toggleFullscreen} className="hover:text-indigo-400 transition">
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
