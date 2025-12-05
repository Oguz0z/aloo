import type { IndustryType, ScrapedWebsiteData } from '@/types';

interface BusinessData {
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  types?: string[];
  scrapedData?: ScrapedWebsiteData | null;
}

// Base opportunities based on what's missing
const BASE_OPPORTUNITIES = {
  noWebsite: [
    'Website design and development',
    'Google Business Profile optimization',
    'Basic SEO setup',
  ],
  socialOnlyWebsite: [
    'Professional website to replace social media presence',
    'Custom domain and professional email setup',
    'Brand identity and online presence upgrade',
  ],
  hasWebsite: [
    'SEO audit and optimization',
    'Website redesign and modernization',
    'Website speed and mobile optimization',
    'Conversion rate optimization',
  ],
  noPhone: ['Business phone system setup', 'Professional phone number and call routing'],
  noEmail: ['Professional email setup', 'Customer relationship management (CRM) system'],
  lowRating: [
    'Reputation management and review improvement',
    'Customer feedback and service improvement consulting',
  ],
  lowReviews: ['Review generation and management system', 'Customer feedback automation'],
};

// Industry-specific opportunities
const INDUSTRY_OPPORTUNITIES: Record<IndustryType, string[]> = {
  restaurant: [
    'Online ordering system',
    'Digital menu with QR codes',
    'Table reservation system',
    'Food delivery platform integration',
    'Social media marketing for restaurants',
  ],
  salon: [
    'Online appointment booking system',
    'Client management software',
    'Loyalty program digitization',
    'SMS appointment reminders',
    'Before/after gallery for marketing',
  ],
  fitness: [
    'Member management and billing system',
    'Online class booking and scheduling',
    'Fitness app or member portal',
    'Personal trainer booking system',
    'Virtual class capabilities',
  ],
  medical: [
    'Patient portal development',
    'Online appointment booking',
    'Telemedicine integration',
    'HIPAA-compliant website and forms',
    'Automated appointment reminders',
  ],
  retail: [
    'E-commerce website development',
    'Inventory management system',
    'Point of sale integration',
    'Customer loyalty program',
    'Local SEO optimization',
  ],
  automotive: [
    'Online service booking system',
    'Customer portal for service history',
    'Parts inventory system',
    'Automated service reminders',
    'Review management for auto shops',
  ],
  real_estate: [
    'Property listing website',
    'Virtual tour integration',
    'Lead capture system',
    'CRM implementation',
    'Email marketing automation',
  ],
  professional_services: [
    'Professional website development',
    'Online consultation booking',
    'Client portal and document management',
    'Invoice and payment system',
    'Content marketing and blog setup',
  ],
  other: [
    'Professional website development',
    'Online presence optimization',
    'Social media marketing',
    'Review management',
    'Digital transformation consulting',
  ],
};

/**
 * Generate business opportunities based on industry and current state
 * Enhanced with scraped website data for more specific recommendations
 */
export function generateOpportunities(
  industryType: IndustryType,
  business: BusinessData
): string[] {
  const opportunities: string[] = [];
  const scraped = business.scrapedData;

  // 1. Website-based opportunities
  if (!business.website) {
    opportunities.push(...BASE_OPPORTUNITIES.noWebsite);
  } else if (isSocialOnlyWebsite(business.website)) {
    opportunities.push(...BASE_OPPORTUNITIES.socialOnlyWebsite);
  } else {
    // Has website - check scraped data for specific issues
    if (scraped?.isReachable) {
      // Outdated website
      if (scraped.estimatedAge === 'outdated' || scraped.estimatedAge === 'ancient') {
        opportunities.push('Website redesign and modernization');
        opportunities.push('Modern UI/UX overhaul');
      }

      // No mobile viewport
      if (!scraped.hasMobileViewport) {
        opportunities.push('Mobile-responsive website redesign');
      }

      // Old tech stack
      if (scraped.hasWordPress && !scraped.hasModernDesign) {
        opportunities.push('WordPress theme modernization');
      }

      // Missing features based on industry
      if (!scraped.hasOnlineBooking && ['salon', 'fitness', 'medical', 'restaurant'].includes(industryType)) {
        opportunities.push('Online appointment/reservation system');
      }

      if (!scraped.hasLiveChat) {
        opportunities.push('Live chat integration for customer support');
      }

      if (!scraped.hasNewsletter) {
        opportunities.push('Email marketing and newsletter setup');
      }

      if (!scraped.hasBlog) {
        opportunities.push('Content marketing and blog setup');
      }

      // No social links on website
      if (scraped.socialCount === 0) {
        opportunities.push('Social media integration on website');
      }

      // No HTTPS
      if (!scraped.isHttps) {
        opportunities.push('SSL certificate and security upgrade');
      }
    } else {
      // Website exists but couldn't be scraped - generic recommendations
      opportunities.push(...BASE_OPPORTUNITIES.hasWebsite);
    }
  }

  // 2. Communication opportunities
  if (!business.phone) {
    opportunities.push(...BASE_OPPORTUNITIES.noPhone);
  }

  // 3. Reputation opportunities
  if (business.rating && business.rating < 4.0) {
    opportunities.push(...BASE_OPPORTUNITIES.lowRating);
  } else if (!business.reviewCount || business.reviewCount < 50) {
    opportunities.push(...BASE_OPPORTUNITIES.lowReviews);
  }

  // 4. Industry-specific opportunities (only add if not already covered)
  const industryOpps = INDUSTRY_OPPORTUNITIES[industryType] || INDUSTRY_OPPORTUNITIES.other;
  for (const opp of industryOpps) {
    if (!opportunities.some((o) => o.toLowerCase().includes(opp.toLowerCase().split(' ')[0]))) {
      opportunities.push(opp);
    }
  }

  // Remove duplicates and limit to 8
  const uniqueOpportunities = [...new Set(opportunities)];
  return uniqueOpportunities.slice(0, 8);
}

/**
 * Detect industry type from Google Maps types
 */
export function detectIndustryType(types: string[]): IndustryType {
  const typesLower = types.map((t) => t.toLowerCase());

  // Restaurant & Cafe
  if (
    typesLower.some(
      (t) =>
        t.includes('restaurant') ||
        t.includes('cafe') ||
        t.includes('coffee') ||
        t.includes('bar') ||
        t.includes('bakery') ||
        t.includes('food')
    )
  ) {
    return 'restaurant';
  }

  // Salon & Spa
  if (
    typesLower.some(
      (t) =>
        t.includes('salon') ||
        t.includes('spa') ||
        t.includes('beauty') ||
        t.includes('barber') ||
        t.includes('hair')
    )
  ) {
    return 'salon';
  }

  // Fitness & Gym
  if (
    typesLower.some(
      (t) =>
        t.includes('gym') || t.includes('fitness') || t.includes('yoga') || t.includes('pilates')
    )
  ) {
    return 'fitness';
  }

  // Medical & Dental
  if (
    typesLower.some(
      (t) =>
        t.includes('dentist') ||
        t.includes('doctor') ||
        t.includes('clinic') ||
        t.includes('medical') ||
        t.includes('health') ||
        t.includes('hospital') ||
        t.includes('pharmacy')
    )
  ) {
    return 'medical';
  }

  // Retail
  if (
    typesLower.some(
      (t) =>
        t.includes('store') ||
        t.includes('shop') ||
        t.includes('retail') ||
        t.includes('boutique') ||
        t.includes('market')
    )
  ) {
    return 'retail';
  }

  // Automotive
  if (
    typesLower.some(
      (t) =>
        t.includes('car') ||
        t.includes('auto') ||
        t.includes('mechanic') ||
        t.includes('repair') ||
        t.includes('dealer')
    )
  ) {
    return 'automotive';
  }

  // Real Estate
  if (
    typesLower.some(
      (t) => t.includes('real_estate') || t.includes('property') || t.includes('realtor')
    )
  ) {
    return 'real_estate';
  }

  // Professional Services
  if (
    typesLower.some(
      (t) =>
        t.includes('lawyer') ||
        t.includes('accountant') ||
        t.includes('consultant') ||
        t.includes('insurance') ||
        t.includes('finance')
    )
  ) {
    return 'professional_services';
  }

  return 'other';
}

/**
 * Check if a website is just a social media profile
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
