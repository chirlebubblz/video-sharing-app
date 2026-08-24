'use client';

import React from 'react';
import { Eye, FileText, Clock, Percent, BarChart2 } from 'lucide-react';

interface VideoAnalyticsProps {
  viewsCount?: number;
  wordCount?: number;
  duration?: number;
  currentTime?: number;
}

export function VideoAnalytics({
  viewsCount = 1,
  wordCount = 0,
  duration = 0,
  currentTime = 0,
}: VideoAnalyticsProps) {
  const watchPct = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;
  
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-5 shadow-xl space-y-5">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart2 className="text-emerald-400" size={18} /> Real Video Stats
        </h3>
        <span className="text-[11px] bg-emerald-500/10 text-emerald-400 font-medium px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          Live Tracking
        </span>
      </div>

      {/* Real Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-950/80 border border-gray-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 truncate mb-1">
            <Eye size={13} className="text-indigo-400 shrink-0" />
            <span className="truncate">Total Views</span>
          </div>
          <div className="text-xl font-black text-white">{viewsCount}</div>
        </div>

        <div className="bg-gray-950/80 border border-gray-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 truncate mb-1">
            <FileText size={13} className="text-emerald-400 shrink-0" />
            <span className="truncate">Words Spoken</span>
          </div>
          <div className="text-xl font-black text-white">{wordCount}</div>
        </div>

        <div className="bg-gray-950/80 border border-gray-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 truncate mb-1">
            <Clock size={13} className="text-amber-400 shrink-0" />
            <span className="truncate">Video Length</span>
          </div>
          <div className="text-xl font-black text-white">{formatTime(duration)}</div>
        </div>

        <div className="bg-gray-950/80 border border-gray-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 truncate mb-1">
            <Percent size={13} className="text-purple-400 shrink-0" />
            <span className="truncate">Watch Progress</span>
          </div>
          <div className="text-xl font-black text-white">{watchPct}%</div>
        </div>
      </div>

      {/* Real Playback Progress Bar */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span className="font-medium">Current Playback Progress</span>
          <span className="font-mono text-indigo-400">{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        <div className="w-full h-3 bg-gray-950 border border-gray-800 rounded-full overflow-hidden p-0.5">
          <div
            style={{ width: `${watchPct}%` }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );
}
