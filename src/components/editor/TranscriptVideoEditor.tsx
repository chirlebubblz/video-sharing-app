'use client';

import React, { useState } from 'react';
import { Scissors, Trash2, Zap, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { TranscriptSegment } from '@/lib/ai/transcription';

interface TranscriptVideoEditorProps {
  transcripts: TranscriptSegment[];
  onTranscriptsUpdated: (updated: TranscriptSegment[]) => void;
}

export function TranscriptVideoEditor({
  transcripts,
  onTranscriptsUpdated,
}: TranscriptVideoEditorProps) {
  const [items, setItems] = useState<TranscriptSegment[]>(transcripts);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [autoStripped, setAutoStripped] = useState(false);

  const toggleDelete = (id: string) => {
    let nextDeleted: string[];
    if (deletedIds.includes(id)) {
      nextDeleted = deletedIds.filter((d) => d !== id);
    } else {
      nextDeleted = [...deletedIds, id];
    }
    setDeletedIds(nextDeleted);
    onTranscriptsUpdated(items.filter((item) => !nextDeleted.includes(item.id)));
  };

  const handleAutoStripFillers = () => {
    const fillerIds = items.filter((item) => item.isFiller).map((item) => item.id);
    const combinedDeleted = Array.from(new Set([...deletedIds, ...fillerIds]));
    setDeletedIds(combinedDeleted);
    setAutoStripped(true);
    onTranscriptsUpdated(items.filter((item) => !combinedDeleted.includes(item.id)));
  };

  const handleReset = () => {
    setDeletedIds([]);
    setAutoStripped(false);
    onTranscriptsUpdated(items);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Scissors className="text-purple-400" size={18} /> Transcript-Based Video Editor
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Click any sentence to cut it from video playback. Delete filler words with one click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoStripFillers}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-md"
          >
            <Zap size={14} /> Auto-Strip Filler Words ("um", "uh")
          </button>
          {deletedIds.length > 0 && (
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl transition flex items-center gap-1 border border-gray-700"
            >
              <RotateCcw size={14} /> Reset Cuts
            </button>
          )}
        </div>
      </div>

      {autoStripped && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl flex items-center gap-2 text-xs text-emerald-400 font-medium">
          <Check size={16} /> Removed {items.filter((i) => i.isFiller).length} filler word segments! Video will skip those timestamps seamlessly.
        </div>
      )}

      {/* Segment List */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
        {items.map((item) => {
          const isCut = deletedIds.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => toggleDelete(item.id)}
              className={`p-3 rounded-2xl cursor-pointer transition flex items-center justify-between border ${
                isCut
                  ? 'bg-red-950/30 border-red-800/40 text-gray-500 line-through opacity-60'
                  : 'bg-gray-950/40 border-gray-800/60 text-gray-200 hover:border-purple-500/50'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 mr-4">
                <span className="font-mono text-xs text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                  {formatTime(item.start)} - {formatTime(item.end)}
                </span>
                <span className="text-sm">{item.text}</span>
                {item.isFiller && !isCut && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-sans flex items-center gap-1">
                    <AlertTriangle size={10} /> Filler
                  </span>
                )}
              </div>
              <button
                className={`p-1.5 rounded-lg transition ${
                  isCut ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-gray-400 hover:text-red-400 hover:bg-red-500/20'
                }`}
                title={isCut ? 'Restore segment' : 'Cut segment'}
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
