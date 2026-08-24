'use client';

import React, { useState } from 'react';
import { MessageSquare, Flame, ThumbsUp, Lightbulb, Heart, Send } from 'lucide-react';

export interface CommentItem {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  createdAt: string;
}

export interface ReactionItem {
  id: string;
  emoji: string;
  timestamp: number;
}

interface TimestampedCommentsProps {
  currentTime: number;
  onSeek: (time: number) => void;
}

export function TimestampedComments({ currentTime, onSeek }: TimestampedCommentsProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [authorName, setAuthorName] = useState('Guest Viewer');

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      author: authorName.trim() || 'Anonymous',
      text: newCommentText.trim(),
      timestamp: currentTime,
      createdAt: 'Just now',
    };

    setComments((prev) => [newComment, ...prev]);
    setNewCommentText('');
  };

  const handleAddReaction = (emoji: string) => {
    const newReaction: ReactionItem = {
      id: `r-${Date.now()}`,
      emoji,
      timestamp: currentTime,
    };
    setReactions((prev) => [...prev, newReaction]);
  };

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-5 shadow-xl space-y-5">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <MessageSquare className="text-indigo-400" size={18} /> Timestamped Comments ({comments.length})
        </h3>
        <div className="flex items-center gap-1.5">
          {['🔥', '👏', '💡', '❤️', '🚀'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleAddReaction(emoji)}
              className="p-1.5 hover:bg-gray-800 rounded-xl transition text-sm hover:scale-125"
              title={`Drop ${emoji} at ${formatTime(currentTime)}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleAddComment} className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your Name"
            className="w-1/3 bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <div className="text-[11px] text-indigo-400 font-mono bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 shrink-0">
            At {formatTime(currentTime)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Leave a comment at this exact moment..."
            className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!newCommentText.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0"
          >
            <Send size={13} /> Comment
          </button>
        </div>
      </form>

      {/* Dropped Reactions Timeline */}
      {reactions.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {reactions.map((r) => (
            <button
              key={r.id}
              onClick={() => onSeek(r.timestamp)}
              className="bg-gray-950 border border-gray-800 hover:border-indigo-500/50 px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5 transition"
            >
              <span>{r.emoji}</span>
              <span className="text-[10px] font-mono text-gray-400">{formatTime(r.timestamp)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Comment List */}
      <div className="space-y-3 pt-2 max-h-60 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-xs space-y-1">
            <MessageSquare size={24} className="mx-auto text-gray-600 mb-2 opacity-50" />
            <p className="font-medium text-gray-400">No comments yet</p>
            <p className="text-[11px] text-gray-600">Be the first to post a timestamped comment!</p>
          </div>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="bg-gray-950/80 border border-gray-800/80 p-3 rounded-2xl space-y-1 hover:border-indigo-500/40 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{c.author}</span>
                  <button
                    onClick={() => onSeek(c.timestamp)}
                    className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded hover:bg-indigo-500/20 transition"
                  >
                    {formatTime(c.timestamp)}
                  </button>
                </div>
                <span className="text-[10px] text-gray-500">{c.createdAt}</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{c.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
