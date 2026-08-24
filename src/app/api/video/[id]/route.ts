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
      videoUrl: `/uploads/${videoId}.webm`,
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
      videoUrl: `/uploads/${videoId}.webm`,
      transcripts: [],
    });
  }
}
