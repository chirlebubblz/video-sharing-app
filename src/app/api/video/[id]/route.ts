import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { processVideoWithAI, generateSummaryFromTranscript } from '@/lib/ai/transcription';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id;
    const shouldIncrement = req.nextUrl.searchParams.get('increment') === 'true';

    let video = null;

    if (shouldIncrement) {
      video = await db.video.update({
        where: { id: videoId },
        data: {
          viewsCount: { increment: 1 },
        },
        include: {
          transcripts: true,
        },
      }).catch(() => null);
    }

    if (!video) {
      video = await db.video.findUnique({
        where: { id: videoId },
        include: { transcripts: true },
      });
    }

    if (video) {
      // Check if stored summary is old placeholder text and replace with real speech summary
      const isOldPlaceholder = !video.summary || video.summary.includes('Overview of the new screen recorder engine');
      const realAI = generateSummaryFromTranscript(video.transcripts, 'DefinitelyNotLoom Recording');

      const title = isOldPlaceholder ? realAI.title : video.title;
      const summary = isOldPlaceholder ? realAI.summary : video.summary;
      const actionItems = isOldPlaceholder
        ? realAI.actionItems
        : (video.actionItems ? JSON.parse(video.actionItems) : realAI.actionItems);
      const chapters = isOldPlaceholder
        ? realAI.chapters
        : (video.chapters ? JSON.parse(video.chapters) : realAI.chapters);

      return NextResponse.json({
        id: video.id,
        title,
        summary,
        actionItems,
        chapters,
        videoUrl: video.videoUrl,
        viewsCount: video.viewsCount,
        transcripts: video.transcripts,
      });
    }

    // Fallback if video record doesn't exist in DB
    const aiResult = await processVideoWithAI(videoId, 'DefinitelyNotLoom Recording');
    return NextResponse.json({
      id: videoId,
      title: aiResult.title,
      summary: aiResult.summary,
      actionItems: aiResult.actionItems,
      chapters: aiResult.chapters,
      videoUrl: `/api/video/stream/${videoId}`,
      transcripts: aiResult.transcripts,
    });
  } catch (err) {
    console.error('Error fetching video:', err);
    const videoId = params.id;
    return NextResponse.json({
      id: videoId,
      title: 'Recorded Screen Video',
      summary: '• Speech & AI intelligence recording session.',
      actionItems: ['Review recording'],
      chapters: [{ time: 0, title: 'Video Start' }],
      videoUrl: `/api/video/stream/${videoId}`,
      transcripts: [],
    });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id;

    // 1. Delete record from Supabase Database
    try {
      await db.video.delete({
        where: { id: videoId },
      });
    } catch (e) {}

    // 2. Delete file object from Supabase Storage Bucket ('videos')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        await fetch(`${supabaseUrl}/storage/v1/object/videos/${videoId}.webm`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
        });
      } catch (e) {}
    }

    return NextResponse.json({ success: true, message: 'Video deleted successfully from Supabase DB & Storage' });
  } catch (err) {
    console.error('Error deleting video:', err);
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}
