'use client';

import React, { useState } from 'react';
import { Search, Sparkles, AlertCircle } from 'lucide-react';
import { TranscriptSegment } from '@/lib/ai/transcription';

interface InteractiveTranscriptProps {
  transcripts: TranscriptSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
}

export function InteractiveTranscript({
  transcripts,
  currentTime,
  onSeek,
}: InteractiveTranscriptProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTranscripts = transcripts.filter((t) =>
    t.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col h-[420px]">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="text-indigo-400" size={18} /> Interactive Transcript
        </h3>
        <div className="relative w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {filteredTranscripts.length === 0 ? (
          <div className="text-center text-gray-500 text-xs py-8">
            No matching transcript lines found.
          </div>
        ) : (
          filteredTranscripts.map((item) => {
            const isActive = currentTime >= item.start && currentTime <= item.end;
            return (
              <div
                key={item.id}
                onClick={() => onSeek(item.start)}
                className={`p-3 rounded-2xl cursor-pointer transition flex items-start gap-3 border ${
                  isActive
                    ? 'bg-indigo-600/15 border-indigo-500/50 text-white font-medium shadow-md'
                    : 'bg-gray-950/40 border-gray-800/60 text-gray-300 hover:bg-gray-800/50 hover:border-gray-700'
                }`}
              >
                <span className="font-mono text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md mt-0.5 border border-indigo-500/20">
                  {formatTime(item.start)}
                </span>
                <div className="flex-1 text-sm leading-relaxed">
                  {item.text}
                  {item.isFiller && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-sans">
                      <AlertCircle size={10} /> Filler
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
