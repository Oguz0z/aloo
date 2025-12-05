import type { BusinessSearchResult, IndustryType } from '@/types';

const LAST_SEARCH_KEY = 'aloo-last-search';

export interface CachedSearch {
  results: BusinessSearchResult[];
  industry: IndustryType;
  city: string;
  country: string;
  timestamp: number;
}

export function saveLastSearch(data: Omit<CachedSearch, 'timestamp'>): void {
  const cached: CachedSearch = {
    ...data,
    timestamp: Date.now(),
  };
  localStorage.setItem(LAST_SEARCH_KEY, JSON.stringify(cached));
}

export function getLastSearch(): CachedSearch | null {
  const stored = localStorage.getItem(LAST_SEARCH_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as CachedSearch;
  } catch {
    return null;
  }
}

export function hasLastSearch(): boolean {
  return localStorage.getItem(LAST_SEARCH_KEY) !== null;
}

export function clearLastSearch(): void {
  localStorage.removeItem(LAST_SEARCH_KEY);
}
