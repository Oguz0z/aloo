import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { encrypt, decrypt, maskApiKey } from '@/lib/crypto';

export type ApiKeyService = 'youtube' | 'rapidapi';

interface ApiKeyResponse {
  service: ApiKeyService;
  maskedKey: string | null;
  hasKey: boolean;
}

// GET - Fetch all API keys (masked)
export async function GET() {
  try {
    const apiKeys = await prisma.apiKey.findMany();

    const services: ApiKeyService[] = ['youtube', 'rapidapi'];
    const response: ApiKeyResponse[] = services.map((service) => {
      const found = apiKeys.find((k) => k.service === service);
      if (found) {
        const decrypted = decrypt(found.key);
        return {
          service,
          maskedKey: maskApiKey(decrypted),
          hasKey: true,
        };
      }
      return {
        service,
        maskedKey: null,
        hasKey: false,
      };
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

// POST - Save or update an API key
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { service, key } = body as { service: ApiKeyService; key: string };

    if (!service || !key) {
      return NextResponse.json({ error: 'Service and key are required' }, { status: 400 });
    }

    const validServices: ApiKeyService[] = ['youtube', 'rapidapi'];
    if (!validServices.includes(service)) {
      return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
    }

    const encryptedKey = encrypt(key);

    await prisma.apiKey.upsert({
      where: { service },
      update: { key: encryptedKey },
      create: { service, key: encryptedKey },
    });

    return NextResponse.json({
      success: true,
      service,
      maskedKey: maskApiKey(key),
    });
  } catch (error) {
    console.error('Failed to save API key:', error);
    return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 });
  }
}

// DELETE - Remove an API key
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service') as ApiKeyService;

    if (!service) {
      return NextResponse.json({ error: 'Service is required' }, { status: 400 });
    }

    await prisma.apiKey.delete({
      where: { service },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete API key:', error);
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
  }
}
