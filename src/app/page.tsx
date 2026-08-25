'use client';

import React, { useState, useEffect } from 'react';
import { StudioRecorder } from '@/components/recorder/StudioRecorder';
import { Video, Play, Clock, Eye, Sparkles, Film, Trash2 } from 'lucide-react';

export default function Home() {
  const [userVideos, setUserVideos] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch saved videos live from Supabase Database API & merge with localStorage
    fetch('/api/videos')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.videos)) {
          const dbVids = data.videos;
          const saved = localStorage.getItem('dnl_my_videos');
          let localVids: any[] = [];
          if (saved) {
            try {
              localVids = JSON.parse(saved) || [];
            } catch (e) {}
          }
          const merged = [...dbVids];
          localVids.forEach((lv) => {
            if (lv.id !== 'vid-demo-1' && lv.id !== 'vid-demo-2' && !merged.some((mv) => mv.id === lv.id)) {
              merged.push(lv);
            }
          });
          setUserVideos(merged);
          try {
            localStorage.setItem('dnl_my_videos', JSON.stringify(merged));
          } catch (e) {}
        }
      })
      .catch(() => {
        const saved = localStorage.getItem('dnl_my_videos');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((v) => v.id !== 'vid-demo-1' && v.id !== 'vid-demo-2');
              setUserVideos(filtered);
            }
          } catch (e) {}
        }
      });

    // 2. Real-time BroadcastChannel & Window postMessage sync across tabs
    const handleNewVideo = (newVid: any) => {
      if (newVid.id === 'vid-demo-1' || newVid.id === 'vid-demo-2') return;
      setUserVideos((prev) => {
        const cleanPrev = prev.filter((v) => v.id !== 'vid-demo-1' && v.id !== 'vid-demo-2');
        const updated = [newVid, ...cleanPrev.filter((v) => v.id !== newVid.id)];
        try {
          localStorage.setItem('dnl_my_videos', JSON.stringify(updated));
        } catch (err) {}
        return updated;
      });
    };

    const handleWindowMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'NEW_VIDEO' && e.data.video) {
        handleNewVideo(e.data.video);
      }
    };
    window.addEventListener('message', handleWindowMessage);

    const channel = new BroadcastChannel('dnl_video_sync');
    channel.onmessage = (e) => {
      if (e.data && e.data.type === 'NEW_VIDEO' && e.data.video) {
        handleNewVideo(e.data.video);
      }
    };

    return () => {
      window.removeEventListener('message', handleWindowMessage);
      channel.close();
    };
  }, []);

  const handleDeleteVideo = async (e: React.MouseEvent, videoId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this video recording?')) return;

    setUserVideos((prev) => {
      const updated = prev.filter((v) => v.id !== videoId);
      try {
        localStorage.setItem('dnl_my_videos', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    try {
      await fetch(`/api/video/${videoId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Studio Banner Header */}
      <nav className="border-b border-zinc-800/80 bg-black/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="Winking Smiley Logo" className="w-9 h-9 shrink-0 drop-shadow" />
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-yellow-400 via-amber-300 to-white text-transparent bg-clip-text">
              Not Another Video Sharing App
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
              <Video className="text-yellow-400" size={22} /> Your Video Library
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Videos you record with the browser extension will show up here automatically.</p>
          </div>
        </div>

        {userVideos.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-12 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 flex items-center justify-center text-3xl mx-auto shadow-inner">
              <Film size={28} />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-xl font-bold text-white">Your Video Library is Empty</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Click the <span className="text-yellow-400 font-bold">😉 extension icon</span> in your browser toolbar to start recording. Your videos will save right here!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userVideos.map((video) => (
              <a
                key={video.id}
                href={`/v/${video.id}`}
                className="group bg-zinc-900/60 border border-zinc-800 hover:border-yellow-400/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-200 flex flex-col justify-between relative"
              >
                <div className={`aspect-video ${video.thumbnail || 'bg-gradient-to-tr from-yellow-950 via-zinc-900 to-black'} relative flex items-center justify-center p-4 border-b border-zinc-800`}>
                  <button
                    onClick={(e) => handleDeleteVideo(e, video.id)}
                    className="absolute top-3 right-3 p-2 bg-black/80 hover:bg-red-500 text-zinc-400 hover:text-white rounded-xl border border-zinc-700 transition z-10 opacity-0 group-hover:opacity-100 shadow-md"
                    title="Delete Video"
                  >
                    <Trash2 size={16} />
                  </button>
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
                      <Clock size={12} /> {video.createdAt || 'Just now'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {video.views || 1} Views
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
