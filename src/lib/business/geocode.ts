import type { GeocodeResult } from '@/types';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    country_code?: string;
  };
}

/**
 * Geocode a city name to coordinates using Nominatim (OpenStreetMap)
 * This is a free service with rate limiting (1 request/second)
 */
export async function geocodeCity(
  city: string,
  countryCode: string = 'au'
): Promise<GeocodeResult | null> {
  try {
    const params = new URLSearchParams({
      q: city,
      format: 'json',
      limit: '1',
      countrycodes: countryCode,
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
      headers: {
        'User-Agent': 'SocialBusinesses/1.0',
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return null;
    }

    const results: NominatimResult[] = await response.json();

    if (results.length === 0) {
      return null;
    }

    const result = results[0];

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      country: result.address?.country_code?.toUpperCase() || countryCode.toUpperCase(),
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
