'use client';

import React, { useState, useEffect } from 'react';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { InteractiveTranscript } from '@/components/player/InteractiveTranscript';
import { TranscriptVideoEditor } from '@/components/editor/TranscriptVideoEditor';
import { TimestampedComments } from '@/components/comments/TimestampedComments';
import { VideoAnalytics } from '@/components/analytics/VideoAnalytics';
import { processVideoWithAI, TranscriptSegment } from '@/lib/ai/transcription';
import { generateSrtContent, generateTxtContent, downloadFile } from '@/lib/transcriptExporter';
import {
  Sparkles,
  Share2,
  CheckCircle2,
  Copy,
  MessageSquare,
  Scissors,
  BarChart2,
  ListChecks,
  Download,
  FileText,
  FileCode,
} from 'lucide-react';

export default function VideoPage({ params }: { params: { id: string } }) {
  const videoId = params.id;
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'transcript' | 'editor' | 'comments' | 'analytics'>('transcript');
  const [copied, setCopied] = useState(false);

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
        if (!data.error) {
          setAiData(data);
          if (isFirstView) {
            sessionStorage.setItem(hasViewedKey, 'true');
          }
        }
      })
      .catch((err) => console.error('Failed to load video:', err));
  }, [videoId]);

  const handleDownloadSrt = () => {
    if (!aiData) return;
    const content = generateSrtContent(aiData.transcripts);
    downloadFile(content, `${aiData.title.toLowerCase().replace(/[^a-z0-0]+/g, '-')}.srt`, 'text/plain');
  };

  const handleDownloadTxt = () => {
    if (!aiData) return;
    const content = generateTxtContent(aiData.title, aiData.summary, aiData.transcripts);
    downloadFile(content, `${aiData.title.toLowerCase().replace(/[^a-z0-0]+/g, '-')}-transcript.txt`, 'text/plain');
  };

  const handleDownloadAll = () => {
    handleDownloadTxt();
    handleDownloadSrt();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!aiData) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Generating AI Transcriptions & Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-white">
      {/* Navbar */}
      <header className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
              DefinitelyNotLoom
            </span>
          </a>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadTxt}
              className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-gray-700"
              title="Save formatted transcript text"
            >
              <FileText size={14} className="text-indigo-400" /> Save Transcript (.txt)
            </button>
            <button
              onClick={handleDownloadSrt}
              className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-gray-700"
              title="Save SubRip subtitle captions"
            >
              <FileCode size={14} className="text-purple-400" /> Subtitles (.srt)
            </button>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-lg"
            >
              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              {copied ? 'Link Copied!' : 'Copy Share Link'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Video Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">{aiData.title}</h1>
            <p className="text-xs text-gray-400 mt-1">
              Recorded with DefinitelyNotLoom Studio • 60fps HD • {aiData.viewsCount || 1} {aiData.viewsCount === 1 ? 'View' : 'Views'}
            </p>
 </div>
        </div>

        {/* Player & Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Player & AI Executive Summary */}
          <div className="lg:col-span-2 space-y-6">
            <VideoPlayer
              src={aiData.videoUrl || `/uploads/${videoId}.webm`}
              chapters={aiData.chapters}
              currentTime={currentTime}
              onTimeUpdate={setCurrentTime}
              onSeek={setCurrentTime}
            />

            {/* AI Executive Summary Card */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="text-indigo-400" size={18} /> AI Executive Summary
              </h3>
              <div className="text-sm text-gray-300 whitespace-pre-line leading-relaxed bg-gray-950/50 p-4 rounded-2xl border border-gray-800">
                {aiData.summary}
              </div>

              {/* Action Items */}
              {aiData.actionItems.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ListChecks size={14} className="text-emerald-400" /> Key Action Items
                  </h4>
                  <ul className="space-y-2">
                    {aiData.actionItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
            <div className="grid grid-cols-4 gap-1 bg-gray-900 border border-gray-800 p-1 rounded-2xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('transcript')}
                className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
                  activeTab === 'transcript' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles size={14} /> Transcript
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
                  activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Scissors size={14} /> AI Trim
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
                  activeTab === 'comments' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <MessageSquare size={14} /> Comments
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
                  activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
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
