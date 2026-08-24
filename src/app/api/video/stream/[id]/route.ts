import { NextRequest, NextResponse } from 'next/server';
import { getVideoBuffer } from '@/lib/videoCache';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id.replace('.webm', '');

    // 1. Stream from in-memory cache (Vercel serverless compatible)
    const cached = getVideoBuffer(videoId);
    if (cached) {
      const uint8 = new Uint8Array(cached.buffer);
      return new NextResponse(uint8, {
        headers: {
          'Content-Type': cached.mimeType,
          'Content-Length': cached.buffer.length.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600, immutable',
        },
      });
    }

    // 2. Stream from local disk if available
    try {
      const filePath = path.join(process.cwd(), 'public', 'uploads', `${videoId}.webm`);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const uint8 = new Uint8Array(buffer);
        return new NextResponse(uint8, {
          headers: {
            'Content-Type': 'video/webm',
            'Content-Length': buffer.length.toString(),
            'Accept-Ranges': 'bytes',
          },
        });
      }
    } catch (e) {}

    return new NextResponse('Video stream not found', { status: 404 });
  } catch (err) {
    console.error('Error streaming video:', err);
    return new NextResponse('Error streaming video', { status: 500 });
  }
}
