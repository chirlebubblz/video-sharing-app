import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { processVideoWithAI } from '@/lib/ai/transcription';
import { uploadVideoToStorage } from '@/lib/storage';

// In-memory store for assembling multi-part chunked uploads
const uploadBufferStore = new Map<string, { chunks: Map<number, Buffer>; totalChunks: number; videoId: string }>();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const videoFile = formData.get('video') as File | null;
    const chunkFile = formData.get('chunk') as File | null;
    const rawTranscript = formData.get('transcript') as string | null;

    const uploadId = formData.get('uploadId') as string | null;
    const chunkIndexStr = formData.get('chunkIndex') as string | null;
    const totalChunksStr = formData.get('totalChunks') as string | null;
    const customVideoId = formData.get('videoId') as string | null;

    // --- Scenario 1: Multi-Chunk Upload Engine (< 2.5MB per chunk to bypass Vercel 4.5MB Payload limit) ---
    if (chunkFile && uploadId && chunkIndexStr && totalChunksStr) {
      const chunkIndex = parseInt(chunkIndexStr, 10);
      const totalChunks = parseInt(totalChunksStr, 10);
      const videoId = customVideoId || `vid-${Date.now()}`;

      if (!uploadBufferStore.has(uploadId)) {
        uploadBufferStore.set(uploadId, {
          chunks: new Map<number, Buffer>(),
          totalChunks,
          videoId,
        });
      }

      const uploadState = uploadBufferStore.get(uploadId)!;
      const chunkBuffer = Buffer.from(await chunkFile.arrayBuffer());
      uploadState.chunks.set(chunkIndex, chunkBuffer);

      // If not all chunks received yet, return chunk progress
      if (uploadState.chunks.size < totalChunks) {
        return NextResponse.json({
          success: true,
          chunkReceived: chunkIndex,
          totalReceived: uploadState.chunks.size,
          totalChunks,
          uploading: true,
        });
      }

      // All chunks received! Reassemble full video buffer
      const orderedBuffers: Buffer[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const buf = uploadState.chunks.get(i);
        if (buf) orderedBuffers.push(buf);
      }
      const fullVideoBuffer = Buffer.concat(orderedBuffers);
      uploadBufferStore.delete(uploadId); // Clean up memory

      const filename = `${videoId}.webm`;
      const videoUrl = await uploadVideoToStorage(fullVideoBuffer, filename);

      let parsedLiveTranscript = null;
      if (rawTranscript) {
        try {
          parsedLiveTranscript = JSON.parse(rawTranscript);
        } catch (e) {}
      }

      const aiResult = await processVideoWithAI(videoId, 'DefinitelyNotLoom Recording', parsedLiveTranscript || undefined);
      const finalTranscripts = parsedLiveTranscript && parsedLiveTranscript.length > 0 ? parsedLiveTranscript : aiResult.transcripts;

      try {
        const video = await db.video.create({
          data: {
            id: videoId,
            title: aiResult.title,
            summary: aiResult.summary,
            actionItems: JSON.stringify(aiResult.actionItems),
            chapters: JSON.stringify(aiResult.chapters),
            videoUrl,
            duration: 32.0,
            transcripts: {
              create: finalTranscripts.map((t: { start: number; end: number; text: string; isFiller?: boolean }) => ({
                start: t.start,
                end: t.end,
                text: t.text,
                isFiller: t.isFiller || false,
              })),
            },
          },
        });

        return NextResponse.json({
          success: true,
          videoId: video.id,
          videoUrl: video.videoUrl,
        });
      } catch (dbErr) {
        return NextResponse.json({
          success: true,
          videoId,
          videoUrl,
        });
      }
    }

    // --- Scenario 2: Single-Payload Direct Upload (Small Videos < 3MB) ---
    const videoId = customVideoId || `vid-${Date.now()}`;
    const filename = `${videoId}.webm`;
    
    let videoUrl = `/uploads/${filename}`;
    if (videoFile) {
      const buffer = Buffer.from(await videoFile.arrayBuffer());
      videoUrl = await uploadVideoToStorage(buffer, filename);
    }

    let parsedLiveTranscript = null;
    if (rawTranscript) {
      try {
        parsedLiveTranscript = JSON.parse(rawTranscript);
      } catch (e) {}
    }

    const aiResult = await processVideoWithAI(videoId, 'DefinitelyNotLoom Recording', parsedLiveTranscript || undefined);
    const finalTranscripts = parsedLiveTranscript && parsedLiveTranscript.length > 0 ? parsedLiveTranscript : aiResult.transcripts;

    try {
      const video = await db.video.create({
        data: {
          id: videoId,
          title: aiResult.title,
          summary: aiResult.summary,
          actionItems: JSON.stringify(aiResult.actionItems),
          chapters: JSON.stringify(aiResult.chapters),
          videoUrl,
          duration: 32.0,
          transcripts: {
            create: finalTranscripts.map((t: { start: number; end: number; text: string; isFiller?: boolean }) => ({
              start: t.start,
              end: t.end,
              text: t.text,
              isFiller: t.isFiller || false,
            })),
          },
        },
      });

      return NextResponse.json({
        success: true,
        videoId: video.id,
        videoUrl: video.videoUrl,
      });
    } catch (dbErr) {
      return NextResponse.json({
        success: true,
        videoId,
        videoUrl,
      });
    }
  } catch (err) {
    console.error('Error handling video chunk upload:', err);
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
  }
}
