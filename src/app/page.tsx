'use client';

import React, { useState, useEffect } from 'react';
import { StudioRecorder } from '@/components/recorder/StudioRecorder';
import { Video, Play, Clock, Eye, Sparkles } from 'lucide-react';

export default function Home() {
  const [userVideos, setUserVideos] = useState<any[]>([
    {
      id: 'vid-demo-1',
      title: 'Quick Product Walkthrough & Feature Tour',
      duration: '0:32',
      views: 42,
      createdAt: '10 mins ago',
      thumbnail: 'bg-gradient-to-tr from-yellow-950 via-zinc-900 to-black',
    },
    {
      id: 'vid-demo-2',
      title: 'AI Transcript-Driven Video Editing Demo',
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

    // 2. Real-time BroadcastChannel sync across tabs (Extension -> Home Screen)
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
    <main className="min-h-screen bg-black text-white">
      {/* Studio Banner Header */}
      <nav className="border-b border-zinc-800/80 bg-black/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="Viking Smiley Logo" className="w-9 h-9 shrink-0 drop-shadow" />
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-yellow-400 via-amber-300 to-white text-transparent bg-clip-text">
              DefinitelyNotLoom
            </span>
            <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">
              Say it with a video, skip the meeting 💬
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-yellow-400 bg-yellow-400/10 px-3.5 py-1.5 rounded-full border border-yellow-400/30">
              <Sparkles size={14} /> Ready to record
            </span>
          </div>
        </div>
      </nav>

      {/* Hero Section: Studio Recorder Component */}
      <section className="py-6">
        <StudioRecorder />
      </section>

      {/* Video Workspace Library */}
      <section className="max-w-7xl mx-auto px-4 py-12 border-t border-zinc-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Video className="text-yellow-400" size={22} /> Your Recent Videos
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Revisit, share, or watch your previous screen recordings.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userVideos.map((video) => (
            <a
              key={video.id}
              href={`/v/${video.id}`}
              className="group bg-zinc-900/60 border border-zinc-800 hover:border-yellow-400/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-200 flex flex-col justify-between"
            >
              <div className={`aspect-video ${video.thumbnail} relative flex items-center justify-center p-4 border-b border-zinc-800`}>
                <div className="w-14 h-14 rounded-full bg-yellow-400 group-hover:scale-110 transition flex items-center justify-center backdrop-blur-md text-black font-extrabold shadow-2xl border border-yellow-300">
                  <Play size={24} className="ml-1 fill-black" />
                </div>
                <span className="absolute bottom-3 right-3 bg-black/80 font-mono text-xs text-yellow-400 px-2.5 py-1 rounded-md border border-zinc-700">
                  {video.duration}
                </span>
              </div>

              <div className="p-5 space-y-2">
                <h3 className="font-bold text-base text-white group-hover:text-yellow-400 transition">
                  {video.title}
                </h3>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
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
