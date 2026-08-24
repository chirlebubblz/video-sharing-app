'use client';

import React from 'react';
import { StudioRecorder } from '@/components/recorder/StudioRecorder';
import { Sparkles, Video, Play, Clock, Eye, MessageSquare, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  const recentVideos = [
    {
      id: 'vid-demo-1',
      title: 'Loom+ Product Walkthrough & Feature Demo',
      duration: '0:32',
      views: 42,
      createdAt: '10 mins ago',
      thumbnail: 'bg-gradient-to-tr from-indigo-900 via-purple-900 to-slate-900',
    },
    {
      id: 'vid-demo-2',
      title: 'AI Transcript-Driven Video Editing Test',
      duration: '1:15',
      views: 18,
      createdAt: '2 hours ago',
      thumbnail: 'bg-gradient-to-tr from-slate-900 via-indigo-950 to-purple-950',
    },
  ];

  return (
    <main className="min-h-screen bg-[#0b0f17] text-white">
      {/* Studio Banner Header */}
      <nav className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Video size={20} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
              DefinitelyNotLoom
            </span>
            <span className="text-[10px] text-gray-400 font-mono italic hidden sm:inline">
              (Totally not Loom... but not really)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <Zap size={14} /> Instant Chunk Streaming Engine Active
            </span>
          </div>
        </div>
      </nav>

      {/* Hero Section: Studio Recorder Component */}
      <section className="py-8">
        <StudioRecorder />
      </section>

      {/* Video Workspace Library */}
      <section className="max-w-5xl mx-auto px-4 py-12 border-t border-gray-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Video className="text-indigo-400" size={22} /> Your Video Library
            </h2>
            <p className="text-xs text-gray-400 mt-1">Instant videos recorded and processed with AI.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recentVideos.map((video) => (
            <a
              key={video.id}
              href={`/v/${video.id}`}
              className="group bg-gray-900/50 border border-gray-800 hover:border-indigo-500/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-200 flex flex-col justify-between"
            >
              <div className={`aspect-video ${video.thumbnail} relative flex items-center justify-center p-4`}>
                <div className="w-14 h-14 rounded-full bg-indigo-600/80 group-hover:scale-110 transition flex items-center justify-center backdrop-blur-md text-white shadow-2xl border border-indigo-400/40">
                  <Play size={24} className="ml-1" />
                </div>
                <span className="absolute bottom-3 right-3 bg-black/80 font-mono text-xs text-white px-2.5 py-1 rounded-md border border-gray-700">
                  {video.duration}
                </span>
              </div>

              <div className="p-5 space-y-2">
                <h3 className="font-bold text-base text-white group-hover:text-indigo-400 transition">
                  {video.title}
                </h3>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {video.createdAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={12} /> {video.views} Views
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
