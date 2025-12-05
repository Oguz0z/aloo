// Industry types for business categorization
export type IndustryType =
  | 'restaurant'
  | 'salon'
  | 'fitness'
  | 'medical'
  | 'retail'
  | 'automotive'
  | 'real_estate'
  | 'professional_services'
  | 'other';

// Lead status for CRM tracking
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'called'
  | 'proposal_sent'
  | 'negotiating'
  | 'won'
  | 'lost'
  | 'not_interested';

// Score breakdown for transparency - Layer-based scoring system
export interface ScoreBreakdown {
  // Layer 1: Basic Presence (max 25 pts)
  noWebsite: number; // +20 if no website
  socialOnlyWebsite: number; // +15 if only social media
  noPhone: number; // +5 if no phone

  // Layer 2: Google Profile Quality (max 20 pts)
  fewPhotos: number; // +8 if <5 photos
  lowReviews: number; // +7 if <20 reviews, +4 if 20-100
  hiddenGem: number; // +5 if high rating but low reviews

  // Layer 3: Website Technical (max 25 pts) - from PageSpeed/Scraping
  poorPerformance: number; // +10 if Lighthouse score <50
  notMobileFriendly: number; // +10 if fails mobile test
  noHttps: number; // +5 if no HTTPS

  // Layer 4: Website Opportunities (max 30 pts) - from Scraping
  outdatedWebsite: number; // +10 if copyright year > 3 years old
  noOnlineBooking: number; // +8 if no booking system (for service businesses)
  noSocialLinks: number; // +5 if no social media links on site
  basicTechStack: number; // +7 if using old/basic tech (plain HTML, old WordPress)

  total: number;
}

// Website analysis result from PageSpeed API
export interface WebsiteAnalysis {
  url: string;
  isHttps: boolean;
  performanceScore: number; // 0-100
  isMobileFriendly: boolean;
  responseTime: number; // ms
  hasErrors: boolean;
  analyzedAt: string;
}

// Scraped website data for enrichment
export interface ScrapedWebsiteData {
  url: string;
  isReachable: boolean;
  loadTimeMs: number;
  title?: string;
  description?: string;
  techStack: string[];
  hasWordPress: boolean;
  hasShopify: boolean;
  hasCustomSite: boolean;
  copyrightYear?: number;
  estimatedAge: 'new' | 'recent' | 'outdated' | 'ancient' | 'unknown';
  hasOnlineBooking: boolean;
  hasContactForm: boolean;
  hasLiveChat: boolean;
  hasNewsletter: boolean;
  hasEcommerce: boolean;
  hasBlog: boolean;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
  };
  socialCount: number;
  hasMobileViewport: boolean;
  isHttps: boolean;
  hasModernDesign: boolean;
  error?: string;
  scrapedAt: string;
}

// Extended business data with photo count
export interface ExtendedBusinessData {
  photoCount: number;
  website?: string | null;
  phone?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  industryType?: IndustryType;
  websiteAnalysis?: WebsiteAnalysis | null;
  scrapedData?: ScrapedWebsiteData | null;
}

// Business search result from API
export interface BusinessSearchResult {
  placeId: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  photoCount: number;
  types: string[];
  photoUrl?: string;
  mapsUrl?: string;
  leadScore: number;
  scoreBreakdown: ScoreBreakdown;
  opportunities: string[];
  industryType: IndustryType;
  websiteAnalysis?: WebsiteAnalysis;
  scrapedData?: ScrapedWebsiteData;
}

// Saved lead in CRM
export interface Lead extends BusinessSearchResult {
  id: string;
  status: LeadStatus;
  notes?: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  savedAt: string;
  updatedAt: string;
  tags?: Tag[];
}

// Contact log entry
export interface ContactLogEntry {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note';
  summary: string;
  outcome?: 'positive' | 'negative' | 'neutral';
  createdAt: string;
}

// Tag for organizing leads
export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

// Pipeline statistics
export interface PipelineStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  conversionRate: number;
  avgLeadScore: number;
  hotLeads: number;
  coldLeads: number;
}

// Industry type configuration
export interface IndustryTypeConfig {
  id: IndustryType;
  label: string;
  icon: string;
  color: string;
}

// Lead status configuration
export interface LeadStatusConfig {
  id: LeadStatus;
  label: string;
  color: string;
  bgColor: string;
}

// Search parameters
export interface BusinessSearchParams {
  businessType: string;
  city: string;
  country?: string;
  limit?: number;
}

// Geocode result
export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
  country: string;
}

// Task types
export type TaskType = 'call' | 'email' | 'meeting' | 'follow_up' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Task interface
export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  dueAt: string;
  priority: TaskPriority;
  completedAt?: string;
  leadId?: string;
  lead?: { id: string; name: string };
  createdAt: string;
}

// Task statistics
export interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  dueToday: number;
}

// Task type configuration
export interface TaskTypeConfig {
  id: TaskType;
  label: string;
  icon: string;
}

// Task priority configuration
export interface TaskPriorityConfig {
  id: TaskPriority;
  label: string;
  color: string;
}

