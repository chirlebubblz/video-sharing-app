'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Pencil, Focus, Trash2, ArrowRight, X } from 'lucide-react';

interface AnnotationCanvasProps {
  active: boolean;
  onClose?: () => void;
}

export function AnnotationCanvas({ active, onClose }: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<'pen' | 'spotlight' | 'arrow'>('pen');
  const [color, setColor] = useState('#ef4444');
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  // Resize canvas whenever active changes to true or window resizes
  useEffect(() => {
    if (!active) return;

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Small delay to ensure DOM mount
    const timeout = setTimeout(resizeCanvas, 50);
    window.addEventListener('resize', resizeCanvas);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [active]);

  if (!active) return null;

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: e.clientX, y: e.clientY };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCoordinates(e);
    setIsDrawing(true);
    lastPosRef.current = pos;
    startPosRef.current = pos;

    if (tool === 'pen') {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const pos = getCoordinates(e);

    if (tool === 'pen') {
      if (lastPosRef.current) {
        ctx.beginPath();
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
      lastPosRef.current = pos;
    } else if (tool === 'spotlight') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (tool === 'arrow' && startPosRef.current && ctx) {
      const pos = getCoordinates(e);
      const { x: sx, y: sy } = startPosRef.current;
      const ex = pos.x;
      const ey = pos.y;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(ey - sy, ex - sx);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 15 * Math.cos(angle - Math.PI / 6), ey - 15 * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(ex - 15 * Math.cos(angle + Math.PI / 6), ey - 15 * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }
    lastPosRef.current = null;
    startPosRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      {/* Floating Toolbar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gray-900/95 border border-gray-700 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center space-x-3 z-50">
        <button
          onClick={() => setTool('pen')}
          className={`p-2 rounded-full transition ${tool === 'pen' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}
          title="Pen Tool"
        >
          <Pencil size={18} />
        </button>
        <button
          onClick={() => setTool('arrow')}
          className={`p-2 rounded-full transition ${tool === 'arrow' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}
          title="Draw Arrow"
        >
          <ArrowRight size={18} />
        </button>
        <button
          onClick={() => setTool('spotlight')}
          className={`p-2 rounded-full transition ${tool === 'spotlight' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}
          title="Spotlight Area"
        >
          <Focus size={18} />
        </button>
        <div className="h-4 w-px bg-gray-700" />
        <div className="flex items-center space-x-1.5">
          {['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#ffffff'].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border-2 transition ${color === c ? 'scale-125 border-white' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="h-4 w-px bg-gray-700" />
        <button
          onClick={clearCanvas}
          className="p-2 rounded-full hover:bg-red-500/20 hover:text-red-400 text-gray-300 transition"
          title="Clear Screen"
        >
          <Trash2 size={18} />
        </button>

        {onClose && (
          <>
            <div className="h-4 w-px bg-gray-700" />
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition"
              title="Close Annotation Mode"
            >
              <X size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
