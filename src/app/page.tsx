'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Settings,
  ArrowLeft,
  Plus,
  ExternalLink,
  Phone,
  Globe,
  Star,
  MessageSquare,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { WelcomeHeader, BusinessTypeSelector, CityInput } from '@/components/search';
import { PreLoader } from '@/components/preloader';
import {
  LeadScoreBadge,
  OpportunitiesList,
  SaveLeadModal,
} from '@/components/leads';
import { SettingsModal } from '@/components/settings';
import { UserMenu } from '@/components/auth';
import { saveLastSearch, getLastSearch } from '@/lib/search-cache';
import type { IndustryType, BusinessSearchResult } from '@/types';

type ViewMode = 'search' | 'results';

export default function Home() {
  const searchParams = useSearchParams();
  const [showPreLoader, setShowPreLoader] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Search state
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(null);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('au');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<BusinessSearchResult[]>([]);
  const [deepAnalysis, setDeepAnalysis] = useState(false);

  // Load cached search results if ?view=results
  useEffect(() => {
    if (searchParams.get('view') === 'results') {
      const cached = getLastSearch();
      if (cached) {
        setSearchResults(cached.results);
        setSelectedIndustry(cached.industry);
        setCity(cached.city);
        setCountry(cached.country);
        setViewMode('results');
        setShowPreLoader(false);
      }
    }
  }, [searchParams]);

  // Saving leads
  const [savingLeadIds, setSavingLeadIds] = useState<Set<string>>(new Set());
  const [savedLeadModal, setSavedLeadModal] = useState<{ isOpen: boolean; businessName: string }>({
    isOpen: false,
    businessName: '',
  });

  // Search businesses
  const handleSearch = async () => {
    if (!selectedIndustry || !city.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const response = await fetch('/api/business/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessType: selectedIndustry,
          city: city.trim(),
          country,
          limit: 50,
          deepAnalysis,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Search failed');
        return;
      }

      setSearchResults(data.results || []);
      setViewMode('results');

      // Cache search results for later access
      if (data.results?.length > 0) {
        saveLastSearch({
          results: data.results,
          industry: selectedIndustry,
          city: city.trim(),
          country,
        });
      }

      if (data.results?.length === 0) {
        toast.error('No businesses found');
      } else {
        toast.success(`Found ${data.results.length} businesses`);
      }
    } catch {
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Save lead
  const handleSaveLead = async (business: BusinessSearchResult) => {
    if (savingLeadIds.has(business.placeId)) return;

    setSavingLeadIds((prev) => new Set(prev).add(business.placeId));
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(business),
      });

      const data = await response.json();

      if (response.ok) {
        setSavedLeadModal({ isOpen: true, businessName: business.name });
      } else if (response.status === 409) {
        toast.info(`${business.name} already in CRM`);
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save lead');
    } finally {
      setSavingLeadIds((prev) => {
        const next = new Set(prev);
        next.delete(business.placeId);
        return next;
      });
    }
  };

  const handleBackToSearch = () => {
    setViewMode('search');
    setSearchResults([]);
  };

  // Render results view
  if (viewMode === 'results') {
    return (
      <div className="min-h-screen px-3 sm:px-4 py-4 sm:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <button
                onClick={handleBackToSearch}
                className="mb-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <h1 className="text-lg sm:text-2xl font-semibold text-white">
                {selectedIndustry} in {city}
              </h1>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                {searchResults.length} businesses found
              </p>
            </div>
            <Link
              href="/crm"
              className="flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              View My Leads
            </Link>
          </div>

          <div className="grid gap-4">
            {searchResults.map((business) => (
              <div
                key={business.placeId}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 sm:p-5"
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {business.name}
                        </h3>
                        {business.address && (
                          <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{business.address}</span>
                          </p>
                        )}
                      </div>
                      <LeadScoreBadge
                        score={business.leadScore}
                        breakdown={business.scoreBreakdown}
                        websiteAnalysis={business.websiteAnalysis}
                      />
                    </div>

                    {/* Contact & Links */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {business.phone && (
                        <a
                          href={`tel:${business.phone}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-700/50 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {business.phone}
                        </a>
                      )}
                      {business.website && (
                        <a
                          href={business.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-700/50 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {business.mapsUrl && (
                        <a
                          href={business.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-700/50 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Maps
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      {business.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          {business.rating.toFixed(1)}
                        </span>
                      )}
                      {business.reviewCount !== undefined && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {business.reviewCount} reviews
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Opportunities & Save */}
                  <div className="lg:w-80 flex flex-col gap-3">
                    <OpportunitiesList opportunities={business.opportunities} maxVisible={2} />
                    <button
                      onClick={() => handleSaveLead(business)}
                      disabled={savingLeadIds.has(business.placeId)}
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      {savingLeadIds.has(business.placeId) ? 'Saving...' : 'Save Lead'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Lead Confirmation Modal */}
        <SaveLeadModal
          isOpen={savedLeadModal.isOpen}
          businessName={savedLeadModal.businessName}
          onClose={() => setSavedLeadModal({ isOpen: false, businessName: '' })}
          onViewCRM={() => {
            setSavedLeadModal({ isOpen: false, businessName: '' });
            window.location.href = '/crm';
          }}
        />
      </div>
    );
  }

  // Render search view (default)
  return (
    <>
      {showPreLoader && <PreLoader onComplete={() => setShowPreLoader(false)} />}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-3 sm:px-4">
        {/* Top Right Controls */}
        <div className="fixed right-3 top-3 sm:right-6 sm:top-6 z-40 flex items-center gap-3">
          <Link
            href="/crm"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            My Leads
          </Link>
          <UserMenu />
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>

        {/* Main content */}
        <div className="flex w-full max-w-3xl flex-col items-center gap-6 sm:gap-8 pt-16 sm:pt-0">
          <WelcomeHeader />

          <p className="text-sm text-gray-400 text-center max-w-md">
            Find local businesses that need your digital services.
            Search by industry and location to discover opportunities.
          </p>

          <BusinessTypeSelector selected={selectedIndustry} onSelect={setSelectedIndustry} />

          {selectedIndustry && (
            <>
              <CityInput
                city={city}
                country={country}
                onCityChange={setCity}
                onCountryChange={setCountry}
                onSearch={handleSearch}
                isLoading={isSearching}
              />

              {/* Deep Analysis Toggle */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={deepAnalysis}
                    onChange={(e) => setDeepAnalysis(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-green-600 transition-colors" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-white group-hover:text-white/90">
                    Deep Website Analysis
                  </span>
                  <span className="text-xs text-gray-500">
                    Analyze website performance via PageSpeed API (slower but more accurate scoring)
                  </span>
                </div>
              </label>
            </>
          )}
        </div>
      </div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
