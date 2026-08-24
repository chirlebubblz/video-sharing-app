import { GoogleGenerativeAI } from '@google/generative-ai';

export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  isFiller?: boolean;
}

export function generateSummaryFromTranscript(transcripts: TranscriptSegment[], videoTitlePrompt?: string) {
  if (!transcripts || transcripts.length === 0) {
    return {
      title: videoTitlePrompt || 'Screen & Audio Recording',
      summary: '• No speech was detected in this recording.\n• Turn on your microphone and speak while recording to generate instant speech-to-text summaries.',
      actionItems: ['Record a new video with microphone enabled to generate action items.'],
      chapters: [{ time: 0, title: 'Video Recording' }],
      transcripts: [],
    };
  }

  const fullText = transcripts.map((t) => t.text).join(' ');
  const title = fullText.length > 5
    ? (fullText.length > 50 ? `${fullText.substring(0, 45)}...` : fullText)
    : (videoTitlePrompt || 'Screen & Audio Recording');

  // Extract bullets from actual speech
  const bullets = transcripts.slice(0, 4).map((t) => `• ${t.text}`);
  const summary = bullets.length > 0 ? bullets.join('\n') : '• Key discussion recorded during session.';

  // Extract explicit action items from speech (words like "need to", "will", "todo", "fix", etc.)
  const explicitActions = transcripts
    .map((t) => t.text)
    .filter((txt) => /\b(need to|will|should|todo|action|must|follow up|check|review|send|fix|update|create)\b/i.test(txt));

  let finalActionItems: string[] = [];

  if (explicitActions.length > 0) {
    finalActionItems = explicitActions.slice(0, 3).map((txt) => `Action: "${txt}"`);
  } else {
    // For short notes or presentations without explicit tasks, create 1 precise action item
    finalActionItems = [
      `Review spoken note: "${transcripts[0].text}"`,
    ];
  }

  // Generate chapters from timestamps
  const chapters = transcripts.slice(0, 4).map((t, idx) => ({
    time: Math.round(t.start),
    title: `Part ${idx + 1}: ${t.text.substring(0, 30)}${t.text.length > 30 ? '...' : ''}`,
  }));

  return {
    title,
    summary,
    actionItems: finalActionItems,
    chapters,
    transcripts,
  };
}

export async function processVideoWithAI(videoId: string, videoTitlePrompt?: string, liveTranscripts?: TranscriptSegment[]) {
  if (liveTranscripts && liveTranscripts.length > 0) {
    return generateSummaryFromTranscript(liveTranscripts, videoTitlePrompt);
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    return generateSummaryFromTranscript(liveTranscripts || [], videoTitlePrompt);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });
    const response = await model.generateContent([
      `You are an AI assistant for a video recording app.
Based on this video recording titled "${videoTitlePrompt || 'Product Walkthrough'}", generate:
1. An engaging Title.
2. A 3-bullet Executive Summary.
3. 3 Action Items.
4. Timed Chapters.
5. Transcript segments.

Return output strictly as JSON with key structure:
{
  "title": string,
  "summary": string,
  "actionItems": string[],
  "chapters": [{"time": number, "title": string}],
  "transcripts": [{"start": number, "end": number, "text": string, "isFiller": boolean}]
}`
    ]);

    const text = response.response.text();
    if (text) {
      return JSON.parse(text);
    }
  } catch (err) {
    console.warn('Gemini API call warning:', err);
  }

  return generateSummaryFromTranscript(liveTranscripts || [], videoTitlePrompt);
}
