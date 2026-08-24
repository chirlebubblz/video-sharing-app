// In-memory video stream cache for Vercel serverless environment
if (!(global as any).__videoCache) {
  (global as any).__videoCache = new Map<string, { buffer: Buffer; mimeType: string }>();
}

const cache: Map<string, { buffer: Buffer; mimeType: string }> = (global as any).__videoCache;

export function cacheVideoBuffer(videoId: string, buffer: Buffer, mimeType = 'video/webm') {
  const cleanId = videoId.replace('.webm', '');
  cache.set(cleanId, { buffer, mimeType });
}

export function getVideoBuffer(videoId: string) {
  const cleanId = videoId.replace('.webm', '');
  return cache.get(cleanId);
}
