'use client';

import React, { useState, useEffect } from 'react';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { InteractiveTranscript } from '@/components/player/InteractiveTranscript';
import { TranscriptVideoEditor } from '@/components/editor/TranscriptVideoEditor';
import { TimestampedComments } from '@/components/comments/TimestampedComments';
import { VideoAnalytics } from '@/components/analytics/VideoAnalytics';
import { TranscriptSegment } from '@/lib/ai/transcription';
import { generateSrtContent, generateTxtContent, downloadFile } from '@/lib/transcriptExporter';
import {
  Sparkles,
  CheckCircle2,
  Copy,
  MessageSquare,
  Scissors,
  BarChart2,
  ListChecks,
  Download,
  FileText,
  FileCode,
  ArrowLeft,
  Trash2,
} from 'lucide-react';

export default function VideoPage({ params }: { params: { id: string } }) {
  const videoId = params.id;
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'transcript' | 'editor' | 'comments' | 'analytics'>('transcript');
  const [copied, setCopied] = useState(false);

  const handleDeleteVideoPage = async () => {
    if (!confirm('Are you sure you want to delete this video recording permanently from Supabase & Library?')) return;

    try {
      const saved = localStorage.getItem('dnl_my_videos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter((v) => v.id !== videoId);
          localStorage.setItem('dnl_my_videos', JSON.stringify(updated));
        }
      }
    } catch (e) {}

    try {
      await fetch(`/api/video/${videoId}`, { method: 'DELETE' });
    } catch (e) {}

    window.location.href = '/';
  };

  // AI & Video Data
  const [aiData, setAiData] = useState<{
    id?: string;
    title: string;
    summary: string;
    actionItems: string[];
    chapters: { time: number; title: string }[];
    videoUrl?: string;
    viewsCount?: number;
    transcripts: TranscriptSegment[];
  } | null>(null);

  useEffect(() => {
    const hasViewedKey = `viewed_${videoId}`;
    const isFirstView = typeof window !== 'undefined' && !sessionStorage.getItem(hasViewedKey);
    const incrementParam = isFirstView ? '?increment=true' : '';

    fetch(`/api/video/${videoId}${incrementParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error && data.title) {
          setAiData(data);
          if (isFirstView) {
            sessionStorage.setItem(hasViewedKey, 'true');
          }
        } else {
          setAiData({
            id: videoId,
            title: 'Recorded Screen Video',
            summary: '• Recorded speech & AI intelligence session.',
            actionItems: ['Review recording session'],
            chapters: [{ time: 0, title: 'Video Recording' }],
            videoUrl: `/api/video/stream/${videoId}`,
            transcripts: [],
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load video:', err);
        setAiData({
          id: videoId,
          title: 'Recorded Screen Video',
          summary: '• Recorded speech & AI intelligence session.',
          actionItems: ['Review recording session'],
          chapters: [{ time: 0, title: 'Video Recording' }],
          videoUrl: `/api/video/stream/${videoId}`,
          transcripts: [],
        });
      });
  }, [videoId]);

  const handleDownloadSrt = () => {
    if (!aiData) return;
    const content = generateSrtContent(aiData.transcripts);
    downloadFile(content, `${aiData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.srt`, 'text/plain');
  };

  const handleDownloadTxt = () => {
    if (!aiData) return;
    const content = generateTxtContent(aiData.title, aiData.summary, aiData.transcripts);
    downloadFile(content, `${aiData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-transcript.txt`, 'text/plain');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!aiData) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm font-medium">Generating AI Transcriptions & Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <header className="border-b border-zinc-800 bg-black/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-300 transition" title="Back to Home Studio">
              <ArrowLeft size={18} />
            </a>
            <a href="/" className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
              <img src="/icon.svg" alt="Viking Smiley Logo" className="w-8 h-8 shrink-0 drop-shadow" />
              <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-white text-transparent bg-clip-text">
                Not Anothe Video Sharing App
              </span>
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!aiData?.videoUrl) return;
                const a = document.createElement('a');
                a.href = aiData.videoUrl;
                a.download = `${aiData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.webm`;
                a.target = '_blank';
                a.click();
              }}
              className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-md"
              title="Download raw HD video file"
            >
              <Download size={15} /> Download Video (.webm)
            </button>
            <button
              onClick={handleDownloadTxt}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-zinc-800"
              title="Save formatted transcript text"
            >
              <FileText size={14} className="text-yellow-400" /> Save Transcript (.txt)
            </button>
            <button
              onClick={handleDownloadSrt}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-zinc-800"
              title="Save SubRip subtitle captions"
            >
              <FileCode size={14} className="text-yellow-400" /> Subtitles (.srt)
            </button>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-extrabold rounded-xl transition flex items-center gap-2 shadow-lg"
            >
              {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
              {copied ? 'Link Copied!' : 'Copy Share Link'}
            </button>
            <button
              onClick={handleDeleteVideoPage}
              className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md"
              title="Delete video from Supabase & Library"
            >
              <Trash2 size={15} /> Delete Video
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Video Title & Metadata */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{aiData.title}</h1>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              Recorded with DefinitelyNotLoom Studio • 60fps HD • {aiData.viewsCount || 1} {aiData.viewsCount === 1 ? 'View' : 'Views'}
            </p>
          </div>
        </div>

        {/* Player & Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Player & AI Executive Summary */}
          <div className="lg:col-span-2 space-y-6">
            <VideoPlayer
              src={aiData.videoUrl || `/api/video/stream/${videoId}`}
              chapters={aiData.chapters}
              currentTime={currentTime}
              onTimeUpdate={setCurrentTime}
              onSeek={setCurrentTime}
            />

            {/* AI Executive Summary Card */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="text-yellow-400" size={18} /> AI Executive Summary
              </h3>
              <div className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed bg-black/80 p-4 rounded-2xl border border-zinc-800">
                {aiData.summary}
              </div>

              {/* Action Items */}
              {aiData.actionItems.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ListChecks size={14} className="text-yellow-400" /> Key Action Items
                  </h4>
                  <ul className="space-y-2">
                    {aiData.actionItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Tabbed Interactive Features */}
          <div className="space-y-4">
            {/* Tabs Bar */}
            <div className="grid grid-cols-4 gap-1 bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('transcript')}
                className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
                  activeTab === 'transcript' ? 'bg-yellow-400 text-black font-extrabold shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles size={14} /> Transcript
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
                  activeTab === 'editor' ? 'bg-yellow-400 text-black font-extrabold shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Scissors size={14} /> AI Trim
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
                  activeTab === 'comments' ? 'bg-yellow-400 text-black font-extrabold shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <MessageSquare size={14} /> Comments
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
                  activeTab === 'analytics' ? 'bg-yellow-400 text-black font-extrabold shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <BarChart2 size={14} /> Stats
              </button>
            </div>

            {/* Tab Views */}
            {activeTab === 'transcript' && (
              <InteractiveTranscript
                transcripts={aiData.transcripts}
                currentTime={currentTime}
                onSeek={setCurrentTime}
              />
            )}

            {activeTab === 'editor' && (
              <TranscriptVideoEditor
                transcripts={aiData.transcripts}
                onTranscriptsUpdated={(updated) => {
                  setAiData({ ...aiData, transcripts: updated });
                }}
              />
            )}

            {activeTab === 'comments' && (
              <TimestampedComments currentTime={currentTime} onSeek={setCurrentTime} />
            )}

            {activeTab === 'analytics' && (
              <VideoAnalytics
                viewsCount={aiData.viewsCount || 1}
                wordCount={aiData.transcripts.reduce((acc, t) => acc + t.text.split(/\s+/).filter(Boolean).length, 0)}
                duration={aiData.transcripts.length > 0 ? Math.max(...aiData.transcripts.map((t) => t.end)) : 30}
                currentTime={currentTime}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
