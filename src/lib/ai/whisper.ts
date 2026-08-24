import { pipeline, env } from '@xenova/transformers';

// Configure transformers for browser/serverless WASM execution
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface WhisperSegment {
  start: number;
  end: number;
  text: string;
}

export async function transcribeWithWhisperWasm(audioBlob: Blob): Promise<WhisperSegment[]> {
  try {
    // Load Whisper Tiny/Base ONNX WASM model
    const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
    
    const audioUrl = URL.createObjectURL(audioBlob);
    const result = await transcriber(audioUrl, {
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
    }) as unknown as { chunks?: { timestamp: [number, number]; text: string }[]; text: string };

    if (result.chunks && result.chunks.length > 0) {
      return result.chunks.map((c) => ({
        start: c.timestamp[0] || 0,
        end: c.timestamp[1] || 5,
        text: c.text.trim(),
      }));
    }

    return [
      {
        start: 0,
        end: 10,
        text: result.text || 'Audio transcribed via Whisper WebAssembly',
      },
    ];
  } catch (err) {
    console.warn('Whisper WASM execution info:', err);
    return [];
  }
}
