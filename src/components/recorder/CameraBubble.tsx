'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, Move, Maximize2, Minimize2 } from 'lucide-react';

interface CameraBubbleProps {
  stream: MediaStream | null;
  shape: 'circle' | 'square';
  size: 'sm' | 'md' | 'lg';
  isOff: boolean;
  onToggleOff: () => void;
  onPositionChange: (x: number, y: number) => void;
}

export function CameraBubble({
  stream,
  shape,
  size,
  isOff,
  onToggleOff,
  onPositionChange,
}: CameraBubbleProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [pos, setPos] = useState({ x: 40, y: window.innerHeight - 300 });
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 300, e.clientX - dragOffsetRef.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 300, e.clientY - dragOffsetRef.current.y));
      setPos({ x: newX, y: newY });
      onPositionChange(newX, newY);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onPositionChange]);

  const sizePx = size === 'sm' ? 160 : size === 'md' ? 220 : 280;

  if (isOff) return null;

  return (
    <div
      style={{ left: `${pos.x}px`, top: `${pos.y}px`, width: `${sizePx}px`, height: `${sizePx}px` }}
      className={`fixed z-40 group cursor-move shadow-2xl border-4 border-indigo-500 overflow-hidden backdrop-blur-md transition-all duration-75 ${
        shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
      }`}
      onMouseDown={handleMouseDown}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover scale-x-[-1]"
      />

      {/* Floating Camera Controls on Hover */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
        <button
          onClick={onToggleOff}
          className="p-2 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full backdrop-blur-sm"
          title="Disable Camera"
        >
          <CameraOff size={16} />
        </button>
        <div className="p-2 bg-gray-900/80 text-gray-300 rounded-full cursor-grab">
          <Move size={16} />
        </div>
      </div>
    </div>
  );
}
