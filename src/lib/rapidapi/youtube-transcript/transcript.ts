import { rapidApiFetch } from '../client';

const YOUTUBE_TRANSCRIPT_HOST = 'youtube-transcript3.p.rapidapi.com';

export interface TranscriptOptions {
  userId: string;
  videoUrl: string;
  lang?: string;
}

export interface TranscriptResult {
  transcript: string;
  videoId: string;
  lang: string;
}

interface TranscriptApiResponse {
  success: boolean;
  transcript?: string;
  error?: string;
}

/**
 * Extract transcript from a YouTube video URL
 */
export async function getYouTubeTranscript({
  userId,
  videoUrl,
  lang = 'en',
}: TranscriptOptions): Promise<TranscriptResult> {
  // Extract video ID from URL for reference
  const videoId = extractVideoId(videoUrl);

  const response = await rapidApiFetch<TranscriptApiResponse>(userId, {
    host: YOUTUBE_TRANSCRIPT_HOST,
    endpoint: '/api/transcript-with-url',
    params: {
      url: videoUrl,
      flat_text: 'true',
      lang,
    },
  });

  if (!response.success || response.error) {
    throw new Error(response.error || 'Failed to extract transcript');
  }

  if (!response.transcript) {
    throw new Error('No transcript available for this video');
  }

  return {
    transcript: response.transcript,
    videoId,
    lang,
  };
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractVideoId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Just the ID itself
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return url; // Return as-is if no pattern matches
}
