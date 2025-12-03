import { google, youtube_v3 } from 'googleapis';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { ApiError } from '@/lib/errors';
import { getCachedApiKey, setCachedApiKey } from '@/lib/cache';

export async function getYouTubeApiKey(userId: string): Promise<string> {
  // Check cache first
  const cached = getCachedApiKey(userId, 'youtube');
  if (cached) {
    return cached;
  }

  // Try to get from database for this user
  const apiKeyRecord = await prisma.apiKey.findUnique({
    where: { userId_service: { userId, service: 'youtube' } },
  });

  if (apiKeyRecord) {
    try {
      const decrypted = decrypt(apiKeyRecord.key);
      setCachedApiKey(userId, 'youtube', decrypted);
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt YouTube API key:', error);
      throw new ApiError(
        'Invalid YouTube API key. Please re-enter it in Settings.',
        'YOUTUBE_KEY_INVALID',
        400
      );
    }
  }

  // Fallback to environment variable
  const envKey = process.env.YOUTUBE_API_KEY;
  if (envKey) {
    return envKey;
  }

  throw new ApiError('Add YouTube API key in Settings', 'YOUTUBE_NOT_CONFIGURED', 400);
}

export async function getYouTubeClient(userId: string): Promise<youtube_v3.Youtube> {
  const apiKey = await getYouTubeApiKey(userId);
  return google.youtube({
    version: 'v3',
    auth: apiKey,
  });
}
