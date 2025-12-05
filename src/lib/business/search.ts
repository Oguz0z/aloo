import { rapidApiFetch } from '@/lib/rapidapi/client';
import { calculateLeadScore } from './scoring';
import { generateOpportunities, detectIndustryType } from './opportunities';
import { analyzeWebsitesBatch } from './pagespeed';
import { scrapeWebsitesBatch, type ScrapedWebsiteData } from './scraper';
import type { BusinessSearchResult, WebsiteAnalysis, ExtendedBusinessData } from '@/types';

const MAPS_API_HOST = 'maps-data.p.rapidapi.com';

// Response from RapidAPI Maps
interface MapsApiResponse {
  data?: MapsBusinessResult[];
}

interface MapsBusinessResult {
  business_id?: string;
  name?: string;
  full_address?: string;
  phone_number?: string;
  website?: string;
  rating?: number;
  review_count?: number;
  types?: string[];
  photos_sample?: { photo_url?: string }[];
  latitude?: number;
  longitude?: number;
}

// Search options
export interface SearchOptions {
  enableWebsiteAnalysis?: boolean; // PageSpeed API (slower, more accurate)
  enableWebsiteScraping?: boolean; // HTML scraping (faster, more data)
  pageSpeedApiKey?: string;
}

/**
 * Search for businesses using RapidAPI Maps
 * With optional website analysis via PageSpeed API and/or HTML scraping
 */
export async function searchBusinesses(
  userId: string,
  businessType: string,
  latitude: number,
  longitude: number,
  limit: number = 20,
  options: SearchOptions = {}
): Promise<BusinessSearchResult[]> {
  const response = await rapidApiFetch<MapsApiResponse>(userId, {
    host: MAPS_API_HOST,
    endpoint: '/searchmaps.php',
    params: {
      query: businessType,
      lat: latitude.toString(),
      lng: longitude.toString(),
      limit: Math.min(limit, 50).toString(),
      zoom: '13',
      lang: 'en',
    },
  });

  if (!response.data || !Array.isArray(response.data)) {
    return [];
  }

  // Filter valid businesses
  const validBusinesses = response.data.filter(
    (business) => business.name && business.business_id
  );

  // Collect websites for analysis
  const websites = validBusinesses
    .map((b) => b.website)
    .filter((w): w is string => !!w);

  // Run website analysis in parallel
  let websiteAnalysisMap: Map<string, WebsiteAnalysis> = new Map();
  let scrapedDataMap: Map<string, ScrapedWebsiteData> = new Map();

  if (websites.length > 0) {
    const analysisPromises: Promise<void>[] = [];

    // PageSpeed analysis (slower, performance metrics)
    if (options.enableWebsiteAnalysis) {
      analysisPromises.push(
        analyzeWebsitesBatch(websites, options.pageSpeedApiKey, 3).then((results) => {
          websiteAnalysisMap = results;
        })
      );
    }

    // HTML scraping (faster, tech stack & features)
    if (options.enableWebsiteScraping) {
      analysisPromises.push(
        scrapeWebsitesBatch(websites, 15).then((results) => {
          scrapedDataMap = results;
        })
      );
    }

    await Promise.all(analysisPromises);
  }

  // Transform and score results with all data
  const results: BusinessSearchResult[] = validBusinesses.map((business) => {
    const websiteUrl = business.website;
    const normalizedUrl = websiteUrl?.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;

    const websiteAnalysis = websiteUrl
      ? websiteAnalysisMap.get(websiteUrl) || websiteAnalysisMap.get(normalizedUrl)
      : undefined;

    const scrapedData = websiteUrl
      ? scrapedDataMap.get(websiteUrl) || scrapedDataMap.get(normalizedUrl)
      : undefined;

    return transformBusinessResult(business, websiteAnalysis, scrapedData);
  });

  // Sort by lead score (highest first)
  results.sort((a, b) => b.leadScore - a.leadScore);

  return results;
}

/**
 * Transform API response to our format with scoring
 */
function transformBusinessResult(
  business: MapsBusinessResult,
  websiteAnalysis?: WebsiteAnalysis,
  scrapedData?: ScrapedWebsiteData
): BusinessSearchResult {
  const types = business.types || [];
  const industryType = detectIndustryType(types);

  // Clean website URL
  let website = business.website;
  if (website && !website.startsWith('http')) {
    website = `https://${website}`;
  }

  // Count photos from the API response
  const photoCount = business.photos_sample?.length || 0;

  // Build extended business data for scoring
  const businessData: ExtendedBusinessData = {
    photoCount,
    website,
    phone: business.phone_number,
    rating: business.rating,
    reviewCount: business.review_count,
    industryType,
    websiteAnalysis: websiteAnalysis || null,
    scrapedData: scrapedData || null,
  };

  // Calculate lead score with new multi-layer system
  const scoreBreakdown = calculateLeadScore(businessData);

  // Generate opportunities (enhanced with scraped data)
  const opportunities = generateOpportunities(industryType, {
    website,
    phone: business.phone_number,
    email: null,
    rating: business.rating,
    reviewCount: business.review_count,
    types,
    scrapedData,
  });

  // Get photo URL
  const photoUrl = business.photos_sample?.[0]?.photo_url || null;

  // Generate Google Maps URL
  const mapsUrl =
    business.latitude && business.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name || '')}&query_place_id=${business.business_id}`
      : null;

  return {
    placeId: business.business_id || '',
    name: business.name || '',
    address: business.full_address || undefined,
    phone: business.phone_number || undefined,
    website: website || undefined,
    rating: business.rating || undefined,
    reviewCount: business.review_count || undefined,
    photoCount,
    types,
    photoUrl: photoUrl || undefined,
    mapsUrl: mapsUrl || undefined,
    leadScore: scoreBreakdown.total,
    scoreBreakdown,
    opportunities,
    industryType,
    websiteAnalysis,
    scrapedData,
  };
}
