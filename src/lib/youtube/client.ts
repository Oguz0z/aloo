import { google, youtube_v3 } from 'googleapis';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

export async function getYouTubeApiKey(): Promise<string> {
  // First, try to get from database
  const apiKeyRecord = await prisma.apiKey.findUnique({
    where: { service: 'youtube' },
  });

  if (apiKeyRecord) {
    return decrypt(apiKeyRecord.key);
  }

  // Fallback to environment variable
  const envKey = process.env.YOUTUBE_API_KEY;
  if (envKey) {
    return envKey;
  }

  throw new Error(
    'YouTube API key not configured. Please add your API key in Settings.'
  );
}

export async function getYouTubeClient(): Promise<youtube_v3.Youtube> {
  const apiKey = await getYouTubeApiKey();
  return google.youtube({
    version: 'v3',
    auth: apiKey,
  });
}
