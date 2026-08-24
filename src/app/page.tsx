'use client';

import React, { useState, useEffect } from 'react';
import { StudioRecorder } from '@/components/recorder/StudioRecorder';
import { Sparkles, Video, Play, Clock, Eye, MessageSquare, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  const [userVideos, setUserVideos] = useState<any[]>([
    {
      id: 'vid-demo-1',
      title: 'Loom+ Product Walkthrough & Feature Demo',
      duration: '0:32',
      views: 42,
      createdAt: '10 mins ago',
      thumbnail: 'bg-gradient-to-tr from-yellow-950 via-zinc-900 to-black',
    },
    {
      id: 'vid-demo-2',
      title: 'AI Transcript-Driven Video Editing Test',
      duration: '1:15',
      views: 18,
      createdAt: '2 hours ago',
      thumbnail: 'bg-gradient-to-tr from-zinc-900 via-amber-950 to-black',
    },
  ]);

  useEffect(() => {
    // 1. Load saved user recordings from localStorage
    const saved = localStorage.getItem('dnl_my_videos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUserVideos((prev) => {
            const combined = [...parsed, ...prev];
            const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
            return unique;
          });
        }
      } catch (e) {}
    }

    // 2. Real-time BroadcastChannel sync across tabs (Extension -> Control Screen)
    const channel = new BroadcastChannel('dnl_video_sync');
    channel.onmessage = (e) => {
      if (e.data && e.data.type === 'NEW_VIDEO' && e.data.video) {
        const newVid = e.data.video;
        setUserVideos((prev) => {
          const updated = [newVid, ...prev.filter((v) => v.id !== newVid.id)];
          try {
            localStorage.setItem('dnl_my_videos', JSON.stringify(updated));
          } catch (err) {}
          return updated;
        });
      }
    };

    return () => channel.close();
  }, []);

  return (
    <main className="min-h-screen bg-[#0b0f17] text-white">
      {/* Studio Banner Header */}
      <nav className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="Viking Smiley Logo" className="w-8 h-8 shrink-0" />
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-yellow-400 via-amber-300 to-white text-transparent bg-clip-text">
              DefinitelyNotLoom
            </span>
            <span className="text-[10px] text-gray-400 font-mono italic hidden sm:inline">
              (Totally not Loom... but not really)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-full border border-yellow-400/30">
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
              <Video className="text-yellow-400" size={22} /> Your Video Library
            </h2>
            <p className="text-xs text-gray-400 mt-1">Instant videos recorded via website, extension, or desktop app.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userVideos.map((video) => (
            <a
              key={video.id}
              href={`/v/${video.id}`}
              className="group bg-gray-900/50 border border-gray-800 hover:border-yellow-400/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-200 flex flex-col justify-between"
            >
              <div className={`aspect-video ${video.thumbnail} relative flex items-center justify-center p-4 border-b border-gray-800`}>
                <div className="w-14 h-14 rounded-full bg-yellow-400 group-hover:scale-110 transition flex items-center justify-center backdrop-blur-md text-black font-extrabold shadow-2xl border border-yellow-300">
                  <Play size={24} className="ml-1 fill-black" />
                </div>
                <span className="absolute bottom-3 right-3 bg-black/80 font-mono text-xs text-yellow-400 px-2.5 py-1 rounded-md border border-gray-700">
                  {video.duration}
                </span>
              </div>

              <div className="p-5 space-y-2">
                <h3 className="font-bold text-base text-white group-hover:text-yellow-400 transition">
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
