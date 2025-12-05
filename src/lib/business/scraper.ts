/**
 * Website Scraper Service
 * Extracts useful data from business websites for lead scoring
 */

export interface ScrapedWebsiteData {
  url: string;
  isReachable: boolean;
  loadTimeMs: number;

  // Basic info
  title?: string;
  description?: string;
  language?: string;

  // Tech detection
  techStack: string[];
  hasWordPress: boolean;
  hasShopify: boolean;
  hasSquarespace: boolean;
  hasWix: boolean;
  hasCustomSite: boolean;

  // Age indicators
  copyrightYear?: number;
  lastModified?: string;
  estimatedAge: 'new' | 'recent' | 'outdated' | 'ancient' | 'unknown';

  // Features detection
  hasOnlineBooking: boolean;
  hasContactForm: boolean;
  hasLiveChat: boolean;
  hasNewsletter: boolean;
  hasEcommerce: boolean;
  hasBlog: boolean;

  // Social media presence
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
  };
  socialCount: number;

  // Mobile & Security
  hasMobileViewport: boolean;
  isHttps: boolean;
  hasSSLIssues: boolean;

  // Quality indicators
  hasModernDesign: boolean; // Based on CSS framework detection
  imageCount: number;
  hasVideo: boolean;

  // Errors
  error?: string;
  scrapedAt: string;
}

// Patterns for tech detection
const TECH_PATTERNS: Record<string, RegExp[]> = {
  WordPress: [/wp-content/i, /wp-includes/i, /wordpress/i],
  Shopify: [/cdn\.shopify/i, /shopify/i],
  Squarespace: [/squarespace/i, /sqsp/i],
  Wix: [/wix\.com/i, /wixstatic/i],
  Webflow: [/webflow/i],
  React: [/react/i, /_next/i, /nextjs/i],
  Vue: [/vue\.js/i, /nuxt/i],
  Angular: [/angular/i, /ng-/i],
  Bootstrap: [/bootstrap/i],
  TailwindCSS: [/tailwind/i],
  jQuery: [/jquery/i],
};

const BOOKING_PATTERNS = [
  /book\s*(now|online|appointment)/i,
  /reserv(e|ation)/i,
  /schedule/i,
  /termin/i, // German
  /buchung/i, // German
  /calendly/i,
  /acuity/i,
  /booksy/i,
  /fresha/i,
  /treatwell/i,
];

const ECOMMERCE_PATTERNS = [
  /add.to.cart/i,
  /shopping.cart/i,
  /checkout/i,
  /buy.now/i,
  /shop/i,
  /warenkorb/i, // German
  /kaufen/i, // German
];

const CHAT_PATTERNS = [
  /intercom/i,
  /drift/i,
  /crisp/i,
  /tawk/i,
  /zendesk/i,
  /livechat/i,
  /hubspot/i,
  /tidio/i,
];

const NEWSLETTER_PATTERNS = [
  /newsletter/i,
  /subscribe/i,
  /mailchimp/i,
  /klaviyo/i,
  /convertkit/i,
  /abonnieren/i, // German
];

/**
 * Scrape a website and extract relevant data
 */
export async function scrapeWebsite(websiteUrl: string): Promise<ScrapedWebsiteData> {
  const startTime = Date.now();
  const result: ScrapedWebsiteData = {
    url: websiteUrl,
    isReachable: false,
    loadTimeMs: 0,
    techStack: [],
    hasWordPress: false,
    hasShopify: false,
    hasSquarespace: false,
    hasWix: false,
    hasCustomSite: true,
    estimatedAge: 'unknown',
    hasOnlineBooking: false,
    hasContactForm: false,
    hasLiveChat: false,
    hasNewsletter: false,
    hasEcommerce: false,
    hasBlog: false,
    socialLinks: {},
    socialCount: 0,
    hasMobileViewport: false,
    isHttps: websiteUrl.startsWith('https'),
    hasSSLIssues: false,
    hasModernDesign: false,
    imageCount: 0,
    hasVideo: false,
    scrapedAt: new Date().toISOString(),
  };

  // Skip social media URLs
  if (isSocialMediaUrl(websiteUrl)) {
    result.error = 'Social media URL - skipped';
    return result;
  }

  try {
    // Ensure URL has protocol
    let url = websiteUrl;
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }

    // Fetch the website with short timeout for speed
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout - fast fail

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LeadScorer/1.0; +https://example.com/bot)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9,de;q=0.8',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);
    result.loadTimeMs = Date.now() - startTime;
    result.isReachable = response.ok;

    if (!response.ok) {
      result.error = `HTTP ${response.status}`;
      return result;
    }

    const html = await response.text();

    // Extract all the data
    extractBasicInfo(html, result);
    detectTechStack(html, result);
    detectFeatures(html, result);
    extractSocialLinks(html, result);
    detectDesignQuality(html, result);
    estimateWebsiteAge(html, result);

    return result;
  } catch (error) {
    result.loadTimeMs = Date.now() - startTime;
    result.error = error instanceof Error ? error.message : 'Unknown error';

    if (result.error.includes('SSL') || result.error.includes('certificate')) {
      result.hasSSLIssues = true;
    }

    return result;
  }
}

/**
 * Batch scrape multiple websites with high concurrency
 * All requests run in parallel for maximum speed
 */
export async function scrapeWebsitesBatch(
  urls: string[],
  concurrency: number = 10 // Higher default concurrency
): Promise<Map<string, ScrapedWebsiteData>> {
  const results = new Map<string, ScrapedWebsiteData>();
  const validUrls = urls.filter((url) => url && !isSocialMediaUrl(url));

  // Process all URLs in parallel batches without delays
  const chunks: string[][] = [];
  for (let i = 0; i < validUrls.length; i += concurrency) {
    chunks.push(validUrls.slice(i, i + concurrency));
  }

  // Process chunks in parallel (all at once for speed)
  const allResults = await Promise.all(
    chunks.map(async (chunk) => {
      const chunkResults = await Promise.all(
        chunk.map(async (url) => {
          const data = await scrapeWebsite(url);
          return { url, data };
        })
      );
      return chunkResults;
    })
  );

  // Flatten and store results
  for (const chunkResults of allResults) {
    for (const { url, data } of chunkResults) {
      results.set(url, data);
    }
  }

  return results;
}

// Helper functions

function isSocialMediaUrl(url: string): boolean {
  const socialDomains = [
    'facebook.com',
    'fb.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'linkedin.com',
    'youtube.com',
    'tiktok.com',
  ];
  return socialDomains.some((domain) => url.toLowerCase().includes(domain));
}

function extractBasicInfo(html: string, result: ScrapedWebsiteData): void {
  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    result.title = titleMatch[1].trim();
  }

  // Description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  if (descMatch) {
    result.description = descMatch[1].trim();
  }

  // Language
  const langMatch = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
  if (langMatch) {
    result.language = langMatch[1].split('-')[0];
  }

  // Mobile viewport
  result.hasMobileViewport = /viewport/i.test(html) && /width=device-width/i.test(html);
}

function detectTechStack(html: string, result: ScrapedWebsiteData): void {
  const detectedTech: string[] = [];

  for (const [tech, patterns] of Object.entries(TECH_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(html))) {
      detectedTech.push(tech);

      // Set specific flags
      if (tech === 'WordPress') result.hasWordPress = true;
      if (tech === 'Shopify') result.hasShopify = true;
      if (tech === 'Squarespace') result.hasSquarespace = true;
      if (tech === 'Wix') result.hasWix = true;
    }
  }

  result.techStack = detectedTech;

  // Custom site = not using a known CMS/builder
  result.hasCustomSite =
    !result.hasWordPress && !result.hasShopify && !result.hasSquarespace && !result.hasWix;
}

function detectFeatures(html: string, result: ScrapedWebsiteData): void {
  // Online booking
  result.hasOnlineBooking = BOOKING_PATTERNS.some((p) => p.test(html));

  // Contact form
  result.hasContactForm =
    /<form[^>]*>/i.test(html) &&
    (/contact/i.test(html) || /email/i.test(html) || /message/i.test(html));

  // Live chat
  result.hasLiveChat = CHAT_PATTERNS.some((p) => p.test(html));

  // Newsletter
  result.hasNewsletter = NEWSLETTER_PATTERNS.some((p) => p.test(html));

  // Ecommerce
  result.hasEcommerce = ECOMMERCE_PATTERNS.some((p) => p.test(html));

  // Blog
  result.hasBlog = /blog/i.test(html) || /artikel/i.test(html) || /news/i.test(html);
}

function extractSocialLinks(html: string, result: ScrapedWebsiteData): void {
  const socialPatterns = {
    facebook: /href=["']([^"']*facebook\.com[^"']*)["']/gi,
    instagram: /href=["']([^"']*instagram\.com[^"']*)["']/gi,
    twitter: /href=["']([^"']*(?:twitter\.com|x\.com)[^"']*)["']/gi,
    linkedin: /href=["']([^"']*linkedin\.com[^"']*)["']/gi,
    youtube: /href=["']([^"']*youtube\.com[^"']*)["']/gi,
    tiktok: /href=["']([^"']*tiktok\.com[^"']*)["']/gi,
  };

  let count = 0;
  for (const [platform, pattern] of Object.entries(socialPatterns)) {
    const match = pattern.exec(html);
    if (match) {
      result.socialLinks[platform as keyof typeof result.socialLinks] = match[1];
      count++;
    }
  }
  result.socialCount = count;
}

function detectDesignQuality(html: string, result: ScrapedWebsiteData): void {
  // Modern design indicators
  const modernIndicators = [
    /tailwind/i,
    /bootstrap/i,
    /material/i,
    /chakra/i,
    /styled-components/i,
    /css-in-js/i,
    /flex/i,
    /grid/i,
  ];
  result.hasModernDesign = modernIndicators.some((p) => p.test(html));

  // Count images
  const imgMatches = html.match(/<img/gi);
  result.imageCount = imgMatches ? imgMatches.length : 0;

  // Has video
  result.hasVideo = /<video/i.test(html) || /youtube\.com\/embed/i.test(html) || /vimeo/i.test(html);
}

function estimateWebsiteAge(html: string, result: ScrapedWebsiteData): void {
  const currentYear = new Date().getFullYear();

  // Look for copyright year
  const copyrightPatterns = [
    /©\s*(\d{4})/,
    /copyright\s*(\d{4})/i,
    /&copy;\s*(\d{4})/,
    /(\d{4})\s*©/,
  ];

  for (const pattern of copyrightPatterns) {
    const match = html.match(pattern);
    if (match) {
      const year = parseInt(match[1]);
      if (year >= 2000 && year <= currentYear) {
        result.copyrightYear = year;
        break;
      }
    }
  }

  // Estimate age based on copyright year
  if (result.copyrightYear) {
    const age = currentYear - result.copyrightYear;
    if (age <= 1) {
      result.estimatedAge = 'new';
    } else if (age <= 3) {
      result.estimatedAge = 'recent';
    } else if (age <= 6) {
      result.estimatedAge = 'outdated';
    } else {
      result.estimatedAge = 'ancient';
    }
  }
}
