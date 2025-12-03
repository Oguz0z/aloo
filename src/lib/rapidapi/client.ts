import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { ApiError, parseRapidApiError } from '@/lib/errors';
import { getCachedApiKey, setCachedApiKey } from '@/lib/cache';

export async function getRapidApiKey(userId: string): Promise<string> {
  // Check cache first
  const cached = getCachedApiKey(userId, 'rapidapi');
  if (cached) {
    return cached;
  }

  // Try to get from database for this user
  const apiKeyRecord = await prisma.apiKey.findUnique({
    where: { userId_service: { userId, service: 'rapidapi' } },
  });

  if (apiKeyRecord) {
    try {
      const decrypted = decrypt(apiKeyRecord.key);
      setCachedApiKey(userId, 'rapidapi', decrypted);
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt RapidAPI key:', error);
      throw new ApiError(
        'Invalid RapidAPI key. Please re-enter it in Settings.',
        'RAPIDAPI_KEY_INVALID',
        400
      );
    }
  }

  // Fallback to environment variable
  const envKey = process.env.RAPIDAPI_KEY;
  if (envKey) {
    return envKey;
  }

  throw new ApiError('Add RapidAPI key in Settings', 'RAPIDAPI_NOT_CONFIGURED', 400);
}

export interface RapidApiRequestOptions {
  host: string;
  endpoint: string;
  params?: Record<string, string>;
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
}

export async function rapidApiFetch<T>(
  userId: string,
  options: RapidApiRequestOptions
): Promise<T> {
  const apiKey = await getRapidApiKey(userId);
  const { host, endpoint, params, method = 'GET', body } = options;

  const url = new URL(`https://${host}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': host,
      ...(body && { 'Content-Type': 'application/json' }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw parseRapidApiError(response.status, errorText);
  }

  return response.json() as Promise<T>;
}
