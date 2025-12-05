'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, LayoutList, Kanban, Plus, Settings, History } from 'lucide-react';
import { UserMenu } from '@/components/auth';
import { getLastSearch, type CachedSearch } from '@/lib/search-cache';

export type ViewMode = 'list' | 'kanban';

interface CRMHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function CRMHeader({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
}: CRMHeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  // Start with null to match server render, then load from localStorage after hydration
  const [lastSearch, setLastSearch] = useState<CachedSearch | null>(null);

  // Load from localStorage only after component mounts (post-hydration)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Required for SSR hydration: server renders null, client loads from localStorage after mount
    setLastSearch(getLastSearch());
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="text-xl font-bold text-white font-orbitron tracking-wider group-hover:text-gray-200 transition-colors">
                ALOO
              </span>
              <span className="hidden sm:block text-sm text-gray-500">CRM</span>
            </Link>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-xl">
            <div
              className={`relative flex items-center transition-all ${
                isSearchFocused ? 'ring-1 ring-white/20' : ''
              }`}
            >
              <Search className="absolute left-3 w-4 h-4 text-gray-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search leads by name, address, phone..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-white/20 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 text-gray-600 hover:text-white"
                >
                  <span className="text-xs">ESC</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: View Toggle & Actions */}
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="hidden sm:flex items-center border border-white/10 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                <span className="hidden lg:inline">List</span>
              </button>
              <button
                onClick={() => onViewModeChange('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Kanban className="w-4 h-4" />
                <span className="hidden lg:inline">Kanban</span>
              </button>
            </div>

            {/* Last Search Button - only show if cached search exists */}
            {lastSearch && (
              <Link
                href="/?view=results"
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-gray-400 text-sm font-medium hover:bg-white/10 hover:text-white transition-colors"
                title={`${lastSearch.industry} in ${lastSearch.city} (${lastSearch.results.length} results)`}
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Last Search</span>
              </Link>
            )}

            {/* New Search Button */}
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-gray-200 text-sm font-medium hover:bg-white/10 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Search</span>
            </Link>

            {/* Settings */}
            <Link
              href="/"
              className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
