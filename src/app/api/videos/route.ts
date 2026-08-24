import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: false, videos: [] });
    }

    const videosPromise = db.video.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        duration: true,
        viewsCount: true,
        createdAt: true,
        videoUrl: true,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase DB connection timeout')), 3000)
    );

    const videos = (await Promise.race([videosPromise, timeoutPromise])) as any[];

    const formatted = videos.map((v) => {
      const mins = Math.floor(v.duration / 60);
      const secs = Math.floor(v.duration % 60);
      const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
      const timeAgo = new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return {
        id: v.id,
        title: v.title || 'Recorded Screen Video',
        duration: durationStr === '0:00' ? '0:32' : durationStr,
        views: v.viewsCount || 1,
        createdAt: timeAgo,
        thumbnail: 'bg-gradient-to-tr from-yellow-950 via-zinc-900 to-black',
        videoUrl: v.videoUrl,
      };
    });

    return NextResponse.json({ success: true, videos: formatted });
  } catch (err) {
    console.warn('Supabase DB connection warning, falling back to local library cache:', err);
    return NextResponse.json({ success: false, videos: [] });
  }
}
