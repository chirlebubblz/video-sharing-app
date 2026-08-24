import { TranscriptSegment } from '@/lib/ai/transcription';

function formatSrtTime(seconds: number): string {
  const date = new Date(0);
  date.setUTCMilliseconds(seconds * 1000);
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss},${ms}`;
}

export function generateSrtContent(transcripts: TranscriptSegment[]): string {
  return transcripts
    .map((t, idx) => {
      return `${idx + 1}\n${formatSrtTime(t.start)} --> ${formatSrtTime(t.end)}\n${t.text}\n`;
    })
    .join('\n');
}

export function generateTxtContent(title: string, summary: string, transcripts: TranscriptSegment[]): string {
  const header = `TITLE: ${title}\n` +
    `========================================\n` +
    `SUMMARY:\n${summary}\n` +
    `========================================\n\n` +
    `TRANSCRIPT:\n----------------------------------------\n`;

  const body = transcripts
    .map((t) => {
      const mins = Math.floor(t.start / 60);
      const secs = Math.floor(t.start % 60);
      const timeStr = `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}]`;
      return `${timeStr} ${t.text}`;
    })
    .join('\n');

  return header + body;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
