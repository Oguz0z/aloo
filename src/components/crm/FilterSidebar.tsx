'use client';

import { useState, useEffect } from 'react';
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Calendar,
  AlertCircle,
  Clock,
  Settings,
} from 'lucide-react';
import { LEAD_STATUSES, INDUSTRY_TYPES } from '@/lib/constants';
import type { LeadStatus, IndustryType, Tag } from '@/types';

// Filter state type
export interface FilterState {
  statuses: LeadStatus[];
  industries: IndustryType[];
  tags: string[]; // Tag IDs
  scoreRange: { min: number; max: number };
  followUp: 'all' | 'today' | 'overdue' | 'this_week';
  sortBy: 'savedAt' | 'leadScore' | 'name' | 'nextFollowUpAt';
  sortOrder: 'asc' | 'desc';
}

// Default filter state
export const defaultFilters: FilterState = {
  statuses: [],
  industries: [],
  tags: [],
  scoreRange: { min: 0, max: 100 },
  followUp: 'all',
  sortBy: 'savedAt',
  sortOrder: 'desc',
};

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  isOpen: boolean;
  onClose: () => void;
  leadCount: number;
  onOpenTagManager?: () => void;
}

export function FilterSidebar({
  filters,
  onFiltersChange,
  isOpen,
  onClose,
  leadCount,
  onOpenTagManager,
}: FilterSidebarProps) {
  // Section collapse state - all closed by default
  const [sections, setSections] = useState({
    status: false,
    score: false,
    industry: false,
    tags: false,
    followUp: false,
    sort: false,
  });

  // Available tags
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  // Fetch available tags on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchTags() {
      try {
        const response = await fetch('/api/tags');
        if (response.ok && isMounted) {
          const data = await response.json();
          setAvailableTags(data.tags);
        }
      } catch {
        // Silently fail
      }
    }

    fetchTags();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleSection = (section: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.statuses.length > 0 ||
    filters.industries.length > 0 ||
    filters.tags.length > 0 ||
    filters.scoreRange.min > 0 ||
    filters.scoreRange.max < 100 ||
    filters.followUp !== 'all';

  // Reset all filters
  const resetFilters = () => {
    onFiltersChange(defaultFilters);
  };

  // Toggle status filter
  const toggleStatus = (status: LeadStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  // Toggle industry filter
  const toggleIndustry = (industry: IndustryType) => {
    const newIndustries = filters.industries.includes(industry)
      ? filters.industries.filter((i) => i !== industry)
      : [...filters.industries, industry];
    onFiltersChange({ ...filters, industries: newIndustries });
  };

  // Toggle tag filter
  const toggleTag = (tagId: string) => {
    const newTags = filters.tags.includes(tagId)
      ? filters.tags.filter((t) => t !== tagId)
      : [...filters.tags, tagId];
    onFiltersChange({ ...filters, tags: newTags });
  };

  // Update score range
  const updateScoreRange = (key: 'min' | 'max', value: number) => {
    const newRange = { ...filters.scoreRange, [key]: value };
    // Ensure min <= max
    if (key === 'min' && value > filters.scoreRange.max) {
      newRange.max = value;
    }
    if (key === 'max' && value < filters.scoreRange.min) {
      newRange.min = value;
    }
    onFiltersChange({ ...filters, scoreRange: newRange });
  };

  // Follow-up options
  const followUpOptions = [
    { id: 'all' as const, label: 'All', icon: null },
    { id: 'today' as const, label: 'Today', icon: Calendar },
    { id: 'overdue' as const, label: 'Overdue', icon: AlertCircle },
    { id: 'this_week' as const, label: 'This Week', icon: Clock },
  ];

  // Sort options
  const sortOptions = [
    { id: 'savedAt' as const, label: 'Date Added' },
    { id: 'leadScore' as const, label: 'Lead Score' },
    { id: 'name' as const, label: 'Name' },
    { id: 'nextFollowUpAt' as const, label: 'Follow-up Date' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-20 left-0 h-full lg:h-auto w-80 lg:w-72 bg-black lg:bg-transparent border-r lg:border-r-0 border-white/10 z-50 lg:z-0 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full lg:h-auto overflow-y-auto lg:overflow-visible p-4 lg:p-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-medium text-gray-200">Filters</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results count & Reset */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
            <span className="text-sm text-gray-500">
              {leadCount} {leadCount === 1 ? 'result' : 'results'}
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('status')}
              className="flex items-center justify-between w-full py-2 text-left"
            >
              <span className="text-sm font-medium text-gray-300">Status</span>
              {sections.status ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {sections.status && (
              <div className="space-y-1 mt-2">
                {LEAD_STATUSES.map((status) => (
                  <label
                    key={status.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.statuses.includes(status.id)}
                      onChange={() => toggleStatus(status.id)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white/20 focus:ring-offset-black"
                    />
                    <span className="text-sm text-gray-400">{status.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Score Range */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('score')}
              className="flex items-center justify-between w-full py-2 text-left"
            >
              <span className="text-sm font-medium text-gray-300">Lead Score</span>
              {sections.score ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {sections.score && (
              <div className="mt-2 px-2">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={filters.scoreRange.min}
                    onChange={(e) =>
                      updateScoreRange('min', parseInt(e.target.value) || 0)
                    }
                    className="w-16 px-2 py-1 text-sm bg-white/5 border border-white/10 rounded-lg text-gray-300 text-center focus:border-white/20 outline-none"
                  />
                  <span className="text-gray-600">to</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={filters.scoreRange.max}
                    onChange={(e) =>
                      updateScoreRange('max', parseInt(e.target.value) || 100)
                    }
                    className="w-16 px-2 py-1 text-sm bg-white/5 border border-white/10 rounded-lg text-gray-300 text-center focus:border-white/20 outline-none"
                  />
                </div>
                {/* Range Slider */}
                <div className="relative mt-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={filters.scoreRange.min}
                    onChange={(e) =>
                      updateScoreRange('min', parseInt(e.target.value))
                    }
                    className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={filters.scoreRange.max}
                    onChange={(e) =>
                      updateScoreRange('max', parseInt(e.target.value))
                    }
                    className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <div className="h-1 bg-white/10 rounded">
                    <div
                      className="h-full bg-white/30 rounded"
                      style={{
                        marginLeft: `${filters.scoreRange.min}%`,
                        width: `${filters.scoreRange.max - filters.scoreRange.min}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Industry Filter */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('industry')}
              className="flex items-center justify-between w-full py-2 text-left"
            >
              <span className="text-sm font-medium text-gray-300">Industry</span>
              {sections.industry ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {sections.industry && (
              <div className="space-y-1 mt-2 max-h-48 overflow-y-auto scrollbar-hidden">
                {INDUSTRY_TYPES.map((industry) => (
                  <label
                    key={industry.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.industries.includes(industry.id)}
                      onChange={() => toggleIndustry(industry.id)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white/20 focus:ring-offset-black"
                    />
                    <span className="text-sm text-gray-400">{industry.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Tags Filter */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('tags')}
              className="flex items-center justify-between w-full py-2 text-left"
            >
              <span className="text-sm font-medium text-gray-300">Tags</span>
              {sections.tags ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {sections.tags && (
              <div className="mt-2">
                {availableTags.length > 0 ? (
                  <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-hidden">
                    {availableTags.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.tags.includes(tag.id)}
                          onChange={() => toggleTag(tag.id)}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white/20 focus:ring-offset-black"
                        />
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm text-gray-400">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 px-2">No tags created yet</p>
                )}
                {onOpenTagManager && (
                  <button
                    onClick={onOpenTagManager}
                    className="flex items-center gap-2 w-full mt-2 px-2 py-1.5 text-sm text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Manage Tags
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Follow-up Filter */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('followUp')}
              className="flex items-center justify-between w-full py-2 text-left"
            >
              <span className="text-sm font-medium text-gray-300">Follow-up</span>
              {sections.followUp ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {sections.followUp && (
              <div className="space-y-1 mt-2">
                {followUpOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() =>
                      onFiltersChange({ ...filters, followUp: option.id })
                    }
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors ${
                      filters.followUp === option.id
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    {option.icon && <option.icon className="w-4 h-4" />}
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('sort')}
              className="flex items-center justify-between w-full py-2 text-left"
            >
              <span className="text-sm font-medium text-gray-300">Sort By</span>
              {sections.sort ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {sections.sort && (
              <div className="mt-2 space-y-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      sortBy: e.target.value as FilterState['sortBy'],
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-gray-300 outline-none focus:border-white/20"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => onFiltersChange({ ...filters, sortOrder: 'asc' })}
                    className={`flex-1 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      filters.sortOrder === 'asc'
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'border-white/10 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Ascending
                  </button>
                  <button
                    onClick={() => onFiltersChange({ ...filters, sortOrder: 'desc' })}
                    className={`flex-1 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      filters.sortOrder === 'desc'
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'border-white/10 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Descending
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
