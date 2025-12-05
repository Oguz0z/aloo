import type { IndustryTypeConfig, LeadStatusConfig, IndustryType } from '@/types';

// Industry types for business categorization
export const INDUSTRY_TYPES: IndustryTypeConfig[] = [
  { id: 'restaurant', label: 'Restaurant & Cafe', icon: 'utensils', color: '#f97316' },
  { id: 'salon', label: 'Salon & Spa', icon: 'scissors', color: '#ec4899' },
  { id: 'fitness', label: 'Fitness & Gym', icon: 'dumbbell', color: '#22c55e' },
  { id: 'medical', label: 'Medical & Dental', icon: 'stethoscope', color: '#3b82f6' },
  { id: 'retail', label: 'Retail Store', icon: 'store', color: '#a855f7' },
  { id: 'automotive', label: 'Automotive', icon: 'car', color: '#6b7280' },
  { id: 'real_estate', label: 'Real Estate', icon: 'home', color: '#14b8a6' },
  {
    id: 'professional_services',
    label: 'Professional Services',
    icon: 'briefcase',
    color: '#64748b',
  },
  { id: 'other', label: 'Other', icon: 'building', color: '#78716c' },
];

/**
 * Search queries for each industry type by country
 * Maps API works best with specific, localized search terms
 * Multiple queries are combined for better coverage
 */
export const INDUSTRY_SEARCH_QUERIES: Record<string, Record<IndustryType, string[]>> = {
  // German search terms
  de: {
    restaurant: ['Restaurant', 'Café', 'Gaststätte', 'Bistro'],
    salon: ['Friseur', 'Friseursalon', 'Kosmetikstudio', 'Nagelstudio', 'Spa'],
    fitness: ['Fitnessstudio', 'Gym', 'Sportstudio', 'Yoga Studio'],
    medical: ['Arztpraxis', 'Zahnarzt', 'Physiotherapie', 'Heilpraktiker'],
    retail: ['Einzelhandel', 'Geschäft', 'Boutique', 'Laden'],
    automotive: ['Autowerkstatt', 'KFZ Werkstatt', 'Autohaus', 'Reifenservice'],
    real_estate: ['Immobilienmakler', 'Hausverwaltung', 'Immobilien', 'Makler'],
    professional_services: ['Steuerberater', 'Rechtsanwalt', 'Unternehmensberatung', 'Architekt'],
    other: ['Dienstleistung', 'Service'],
  },
  // English search terms (US, AU, GB, CA, NZ)
  en: {
    restaurant: ['Restaurant', 'Cafe', 'Bistro', 'Eatery'],
    salon: ['Hair Salon', 'Beauty Salon', 'Nail Salon', 'Spa', 'Barber'],
    fitness: ['Gym', 'Fitness Center', 'Yoga Studio', 'Personal Trainer'],
    medical: ['Doctor', 'Dentist', 'Physiotherapy', 'Medical Clinic', 'Chiropractor'],
    retail: ['Retail Store', 'Shop', 'Boutique'],
    automotive: ['Auto Repair', 'Car Mechanic', 'Auto Service', 'Car Dealership'],
    real_estate: ['Real Estate Agent', 'Property Manager', 'Realtor', 'Real Estate Agency'],
    professional_services: ['Accountant', 'Lawyer', 'Consultant', 'Architect'],
    other: ['Business', 'Service'],
  },
};

/**
 * Get the best search query for an industry type and country
 * Returns the primary (most specific) search term
 */
export function getSearchQuery(industryType: IndustryType, countryCode: string): string {
  const lang = countryCode === 'de' ? 'de' : 'en';
  const queries = INDUSTRY_SEARCH_QUERIES[lang]?.[industryType];
  return queries?.[0] || industryType.replace('_', ' ');
}

/**
 * Get all search queries for an industry type and country
 * Used for broader searches
 */
export function getAllSearchQueries(industryType: IndustryType, countryCode: string): string[] {
  const lang = countryCode === 'de' ? 'de' : 'en';
  return INDUSTRY_SEARCH_QUERIES[lang]?.[industryType] || [industryType.replace('_', ' ')];
}

// Lead status configuration - monochrome design
export const LEAD_STATUSES: LeadStatusConfig[] = [
  { id: 'new', label: 'New', color: '#9ca3af', bgColor: 'transparent' },
  { id: 'contacted', label: 'Contacted', color: '#9ca3af', bgColor: 'transparent' },
  { id: 'called', label: 'Called', color: '#9ca3af', bgColor: 'transparent' },
  { id: 'proposal_sent', label: 'Proposal Sent', color: '#9ca3af', bgColor: 'transparent' },
  { id: 'negotiating', label: 'Negotiating', color: '#9ca3af', bgColor: 'transparent' },
  { id: 'won', label: 'Won', color: '#22c55e', bgColor: 'transparent' },
  { id: 'lost', label: 'Lost', color: '#6b7280', bgColor: 'transparent' },
  { id: 'not_interested', label: 'Not Interested', color: '#6b7280', bgColor: 'transparent' },
];

// Country codes for search
export const COUNTRIES = [
  { code: 'au', name: 'Australia' },
  { code: 'us', name: 'United States' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'ca', name: 'Canada' },
  { code: 'nz', name: 'New Zealand' },
  { code: 'de', name: 'Germany' },
];

// Contact log types
export const CONTACT_TYPES = [
  { id: 'call', label: 'Phone Call', icon: 'phone' },
  { id: 'email', label: 'Email', icon: 'mail' },
  { id: 'meeting', label: 'Meeting', icon: 'calendar' },
  { id: 'note', label: 'Note', icon: 'sticky-note' },
];

// Outcome types
export const OUTCOMES = [
  { id: 'positive', label: 'Positive', color: '#22c55e' },
  { id: 'neutral', label: 'Neutral', color: '#6b7280' },
  { id: 'negative', label: 'Negative', color: '#ef4444' },
];
