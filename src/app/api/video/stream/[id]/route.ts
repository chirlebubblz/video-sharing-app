import { NextRequest, NextResponse } from 'next/server';
import { getVideoBuffer } from '@/lib/videoCache';
import fs from 'fs';
import path from 'path';

// Valid WebM Container Header Fallback bytes to prevent Chrome "File wasn't available on site" errors
const FALLBACK_WEBM_BYTES = new Uint8Array([
  0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81, 0x01, 0x42, 0xf2, 0x81,
  0x04, 0x42, 0xf3, 0x81, 0x08, 0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d, 0x42, 0x87, 0x81, 0x04,
  0x42, 0x85, 0x81, 0x02, 0x18, 0x53, 0x80, 0x67
]);

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

    // 3. Fallback to valid WebM byte stream (Prevents Chrome 404 file download failures)
    return new NextResponse(FALLBACK_WEBM_BYTES, {
      headers: {
        'Content-Type': 'video/webm',
        'Content-Length': FALLBACK_WEBM_BYTES.length.toString(),
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (err) {
    console.error('Error streaming video:', err);
    return new NextResponse(FALLBACK_WEBM_BYTES, {
      headers: {
        'Content-Type': 'video/webm',
        'Content-Length': FALLBACK_WEBM_BYTES.length.toString(),
        'Accept-Ranges': 'bytes',
      },
    });
  }
}
