import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { geocodeCity, searchBusinesses } from '@/lib/business';
import { getSearchQuery } from '@/lib/constants';
import { ApiError } from '@/lib/errors';
import type { IndustryType } from '@/types';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessType,
      city,
      country = 'au',
      limit = 20,
      deepAnalysis = false,
    } = body;

    if (!businessType || !city) {
      return NextResponse.json(
        { error: 'Business type and city are required' },
        { status: 400 }
      );
    }

    // Geocode the city
    const geocodeResult = await geocodeCity(city, country);
    if (!geocodeResult) {
      return NextResponse.json(
        { error: `Could not find location: ${city}. Try a different city.` },
        { status: 400 }
      );
    }

    // Get localized search query for better results
    // e.g., "real_estate" + "de" → "Immobilienmakler"
    const searchQuery = getSearchQuery(businessType as IndustryType, country);

    // Search for businesses with optional website analysis
    // Scraping is always enabled (fast, provides tech stack & features)
    // PageSpeed analysis is optional (slower, provides performance metrics)
    const results = await searchBusinesses(
      session.user.id,
      searchQuery,
      geocodeResult.latitude,
      geocodeResult.longitude,
      limit,
      {
        enableWebsiteScraping: true, // Always scrape for tech stack & features
        enableWebsiteAnalysis: deepAnalysis, // Optional PageSpeed analysis
      }
    );

    // Save search to database
    await prisma.businessSearch.create({
      data: {
        userId: session.user.id,
        businessType,
        city,
        country,
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        results: {
          create: results.map((result) => ({
            placeId: result.placeId,
            name: result.name,
            address: result.address,
            phone: result.phone,
            website: result.website,
            rating: result.rating,
            reviewCount: result.reviewCount,
            types: JSON.stringify(result.types),
            photoUrl: result.photoUrl,
            mapsUrl: result.mapsUrl,
            leadScore: result.leadScore,
          })),
        },
      },
    });

    return NextResponse.json({
      results,
      location: geocodeResult,
      count: results.length,
    });
  } catch (error) {
    console.error('Business search error:', error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Search failed. Please try again.' },
      { status: 500 }
    );
  }
}
