import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { geocodeCity } from '@/lib/business';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const country = searchParams.get('country') || 'au';

    if (!city) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 });
    }

    const result = await geocodeCity(city, country);

    if (!result) {
      return NextResponse.json(
        { error: `Could not find location: ${city}` },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json(
      { error: 'Geocoding failed. Please try again.' },
      { status: 500 }
    );
  }
}
