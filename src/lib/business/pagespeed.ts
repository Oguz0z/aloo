import type { WebsiteAnalysis } from '@/types';

const PAGESPEED_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

interface PageSpeedResponse {
  lighthouseResult?: {
    categories?: {
      performance?: { score?: number };
    };
    audits?: {
      'server-response-time'?: { numericValue?: number };
      'is-on-https'?: { score?: number };
      viewport?: { score?: number };
    };
  };
  loadingExperience?: {
    overall_category?: string;
  };
  error?: {
    message?: string;
  };
}

/**
 * Analyze a website using Google PageSpeed Insights API
 * Note: Works without API key but has rate limits (~25 req/100s)
 * With API key: 25,000 requests/day
 */
export async function analyzeWebsite(
  websiteUrl: string,
  apiKey?: string
): Promise<WebsiteAnalysis | null> {
  try {
    // Ensure URL has protocol
    let url = websiteUrl;
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }

    // Build API URL
    const params = new URLSearchParams({
      url,
      strategy: 'mobile', // Mobile-first analysis
      category: 'performance',
    });

    if (apiKey) {
      params.append('key', apiKey);
    }

    const response = await fetch(`${PAGESPEED_API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`PageSpeed API error: ${response.status}`);
      return createErrorAnalysis(url);
    }

    const data: PageSpeedResponse = await response.json();

    if (data.error) {
      console.error(`PageSpeed API error: ${data.error.message}`);
      return createErrorAnalysis(url);
    }

    const lighthouse = data.lighthouseResult;
    if (!lighthouse) {
      return createErrorAnalysis(url);
    }

    // Extract metrics
    const performanceScore = Math.round((lighthouse.categories?.performance?.score || 0) * 100);
    const responseTime = lighthouse.audits?.['server-response-time']?.numericValue || 0;
    const isHttps = (lighthouse.audits?.['is-on-https']?.score || 0) === 1;
    const hasViewport = (lighthouse.audits?.viewport?.score || 0) === 1;

    return {
      url,
      isHttps,
      performanceScore,
      isMobileFriendly: hasViewport && performanceScore >= 50,
      responseTime: Math.round(responseTime),
      hasErrors: false,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Website analysis failed:', error);
    return createErrorAnalysis(websiteUrl);
  }
}

/**
 * Create an error analysis result
 */
function createErrorAnalysis(url: string): WebsiteAnalysis {
  return {
    url,
    isHttps: url.startsWith('https'),
    performanceScore: 0,
    isMobileFriendly: false,
    responseTime: 0,
    hasErrors: true,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Batch analyze multiple websites with rate limiting
 * Processes max 5 concurrent requests to avoid rate limits
 */
export async function analyzeWebsitesBatch(
  websites: string[],
  apiKey?: string,
  concurrency: number = 3
): Promise<Map<string, WebsiteAnalysis>> {
  const results = new Map<string, WebsiteAnalysis>();
  const validWebsites = websites.filter((url) => url && !isSocialOnlyWebsite(url));

  // Process in batches
  for (let i = 0; i < validWebsites.length; i += concurrency) {
    const batch = validWebsites.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const analysis = await analyzeWebsite(url, apiKey);
        return { url, analysis };
      })
    );

    for (const { url, analysis } of batchResults) {
      if (analysis) {
        results.set(url, analysis);
      }
    }

    // Small delay between batches to avoid rate limiting
    if (i + concurrency < validWebsites.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Check if a website is just a social media profile (skip analysis)
 */
function isSocialOnlyWebsite(website: string): boolean {
  const socialPatterns = [
    'facebook.com',
    'fb.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'tiktok.com',
    'linkedin.com',
    'youtube.com',
  ];

  const lowerWebsite = website.toLowerCase();
  return socialPatterns.some((pattern) => lowerWebsite.includes(pattern));
}
