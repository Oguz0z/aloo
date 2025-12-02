'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { useSession } from 'next-auth/react';
import { Bookmark, RefreshCw, FileText, X, Loader2, MessageSquareText } from 'lucide-react';
import { toast } from 'sonner';
import type { Platform, SavedSearchWithResults, RepurposeVideo, Script } from '@/types';

export interface SearchHistory {
  id: string;
  query: string;
  platform: Platform;
  timestamp: number;
}

const STORAGE_KEY_PREFIX = 'social-bro-search-history';
const MAX_HISTORY = 20;

// Event for notifying search history updates
const HISTORY_UPDATE_EVENT = 'social-bro-history-update';

// Current user ID for localStorage key (set by component)
let currentUserId: string | null = null;

function getStorageKey(): string {
  return currentUserId ? `${STORAGE_KEY_PREFIX}-${currentUserId}` : STORAGE_KEY_PREFIX;
}

// Helper functions for localStorage
function getSearchHistory(): SearchHistory[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(getStorageKey());
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to parse search history from localStorage:', error);
    return [];
  }
}

function saveSearchHistory(history: SearchHistory[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(history));
    window.dispatchEvent(new Event(HISTORY_UPDATE_EVENT));
  } catch (error) {
    console.error('Failed to save search history to localStorage:', error);
  }
}

export function addSearchToHistory(query: string, platform: Platform): void {
  const history = getSearchHistory();

  // Remove duplicate if exists
  const filtered = history.filter(
    (h) => !(h.query.toLowerCase() === query.toLowerCase() && h.platform === platform)
  );

  // Add new search at the beginning
  const newSearch: SearchHistory = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    query,
    platform,
    timestamp: Date.now(),
  };

  const updated = [newSearch, ...filtered].slice(0, MAX_HISTORY);
  saveSearchHistory(updated);
}

function removeSearchFromHistory(id: string): void {
  const history = getSearchHistory();
  const filtered = history.filter((h) => h.id !== id);
  saveSearchHistory(filtered);
}

// Subscribe to search history changes for useSyncExternalStore
function subscribeToSearchHistory(callback: () => void): () => void {
  window.addEventListener(HISTORY_UPDATE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(HISTORY_UPDATE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

// Cache for snapshots to prevent infinite loops
const snapshotCache = {
  storageKey: null as string | null,
  dataString: null as string | null,
  data: [] as SearchHistory[],
};

function getSearchHistorySnapshot(): SearchHistory[] {
  if (typeof window === 'undefined') return snapshotCache.data;

  const storageKey = getStorageKey();
  const currentString = localStorage.getItem(storageKey);

  // Only update cache if data actually changed
  if (storageKey === snapshotCache.storageKey && currentString === snapshotCache.dataString) {
    return snapshotCache.data;
  }

  // Data or key changed, update cache
  snapshotCache.storageKey = storageKey;
  snapshotCache.dataString = currentString;
  snapshotCache.data = currentString ? JSON.parse(currentString) : [];

  return snapshotCache.data;
}

// Server snapshot - cached empty array
const emptyArray: SearchHistory[] = [];
function getServerSnapshot(): SearchHistory[] {
  return emptyArray;
}

// Set user ID (called from component via useEffect)
export function setSearchHistoryUserId(userId: string | null): void {
  if (currentUserId !== userId) {
    currentUserId = userId;
    // Trigger update so useSyncExternalStore re-reads
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(HISTORY_UPDATE_EVENT));
    }
  }
}

type TabId = Platform | 'all' | 'saved' | 'repurpose' | 'scripts';

const TABS: { id: TabId; label: string; icon?: 'bookmark' | 'refresh' | 'file' }[] = [
  { id: 'all', label: 'All' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'saved', label: 'Saved', icon: 'bookmark' },
  { id: 'repurpose', label: 'Repurpose', icon: 'refresh' },
  { id: 'scripts', label: 'Scripts', icon: 'file' },
];

interface PreviousSearchesProps {
  onSearchSelect: (query: string, platform: Platform) => void;
  onSavedSearchSelect: (savedSearch: SavedSearchWithResults) => void;
  onRepurposeSelect?: (video: RepurposeVideo) => void;
  onScriptSelect?: (script: Script) => void;
  onRepurposeTabClick?: () => void;
  onScriptsTabClick?: () => void;
}

export function PreviousSearches({
  onSearchSelect,
  onSavedSearchSelect,
  onRepurposeSelect,
  onScriptSelect,
  onRepurposeTabClick,
  onScriptsTabClick,
}: PreviousSearchesProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [savedSearches, setSavedSearches] = useState<SavedSearchWithResults[] | null>(null);
  const [repurposeVideos, setRepurposeVideos] = useState<RepurposeVideo[] | null>(null);
  const [scripts, setScripts] = useState<Script[] | null>(null);
  const [extractingTranscriptId, setExtractingTranscriptId] = useState<string | null>(null);

  // Set user ID for localStorage isolation
  useEffect(() => {
    setSearchHistoryUserId(session?.user?.id ?? null);
  }, [session?.user?.id]);

  // Use useSyncExternalStore to safely read from localStorage without hydration mismatch
  const searches = useSyncExternalStore(
    subscribeToSearchHistory,
    getSearchHistorySnapshot,
    getServerSnapshot
  );

  // Fetch saved searches when tab changes to 'saved'
  useEffect(() => {
    if (activeTab !== 'saved' || savedSearches !== null) return;

    fetch('/api/saved')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch saved searches');
        return res.json();
      })
      .then((data) => {
        setSavedSearches(data.savedSearches || []);
      })
      .catch((err) => {
        console.error('Failed to fetch saved searches:', err);
        setSavedSearches([]);
        toast.error('Failed to load saved');
      });
  }, [activeTab, savedSearches]);

  // Fetch repurpose videos when tab changes to 'repurpose'
  useEffect(() => {
    if (activeTab !== 'repurpose' || repurposeVideos !== null) return;

    fetch('/api/repurpose')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch repurpose videos');
        return res.json();
      })
      .then((data) => {
        setRepurposeVideos(data.videos || []);
      })
      .catch((err) => {
        console.error('Failed to fetch repurpose videos:', err);
        setRepurposeVideos([]);
        toast.error('Failed to load repurpose list');
      });
  }, [activeTab, repurposeVideos]);

  // Fetch scripts when tab changes to 'scripts'
  useEffect(() => {
    if (activeTab !== 'scripts' || scripts !== null) return;

    fetch('/api/scripts')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch scripts');
        return res.json();
      })
      .then((data) => {
        setScripts(data.scripts || []);
      })
      .catch((err) => {
        console.error('Failed to fetch scripts:', err);
        setScripts([]);
        toast.error('Failed to load scripts');
      });
  }, [activeTab, scripts]);

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeSearchFromHistory(id);
  };

  const handleDeleteSaved = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/saved?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setSavedSearches((prev) => prev?.filter((s) => s.id !== id) ?? null);
        toast.success('Deleted');
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteRepurpose = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/repurpose?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setRepurposeVideos((prev) => prev?.filter((v) => v.id !== id) ?? null);
        toast.success('Removed from repurpose list');
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteScript = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/scripts?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setScripts((prev) => prev?.filter((s) => s.id !== id) ?? null);
        toast.success('Script deleted');
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleExtractTranscript = async (e: React.MouseEvent, video: RepurposeVideo) => {
    e.stopPropagation();
    if (extractingTranscriptId || video.platform !== 'youtube') return;

    setExtractingTranscriptId(video.id);
    try {
      const response = await fetch('/api/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repurposeVideoId: video.id }),
      });

      const data = await response.json();

      if (response.ok) {
        // Invalidate scripts cache so it refetches
        setScripts(null);
        if (data.alreadyExists) {
          toast.success('Transcript already extracted');
        } else {
          toast.success('Transcript extracted and saved to Scripts');
        }
        // Switch to scripts tab to show the new script
        setActiveTab('scripts');
      } else {
        toast.error(data.error || 'Failed to extract transcript');
      }
    } catch (error) {
      console.error('Failed to extract transcript:', error);
      toast.error('Failed to extract transcript');
    } finally {
      setExtractingTranscriptId(null);
    }
  };

  const filteredSearches =
    activeTab === 'all'
      ? searches
      : activeTab === 'saved' || activeTab === 'repurpose' || activeTab === 'scripts'
        ? []
        : searches.filter((s) => s.platform === activeTab);

  // Helper to get header text
  const getHeaderText = () => {
    switch (activeTab) {
      case 'saved':
        return 'Your saved searches';
      case 'repurpose':
        return 'Videos to repurpose';
      case 'scripts':
        return 'Your scripts';
      default:
        return 'Your previous searches';
    }
  };

  // Helper to render tab icon
  const renderTabIcon = (icon?: 'bookmark' | 'refresh' | 'file') => {
    switch (icon) {
      case 'bookmark':
        return <Bookmark className="h-3 w-3" />;
      case 'refresh':
        return <RefreshCw className="h-3 w-3" />;
      case 'file':
        return <FileText className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Show component if we have searches OR if we're on special tabs
  if (
    searches.length === 0 &&
    activeTab !== 'saved' &&
    activeTab !== 'repurpose' &&
    activeTab !== 'scripts'
  )
    return null;

  // Render content for each tab
  const renderContent = () => {
    switch (activeTab) {
      case 'saved':
        if (savedSearches === null) {
          return <p className="text-xs sm:text-sm text-white/40">Loading saved searches...</p>;
        }
        if (savedSearches.length === 0) {
          return <p className="text-xs sm:text-sm text-white/40">No saved searches yet</p>;
        }
        return savedSearches.map((saved) => (
          <div key={saved.id} className="group relative">
            <button
              onClick={() => onSavedSearchSelect(saved)}
              className="flex items-center gap-1.5 sm:gap-2 max-w-[140px] sm:max-w-[200px] truncate rounded-lg border border-white/20 bg-white/[0.08] px-2.5 sm:px-3 py-1.5 sm:py-2 pr-6 sm:pr-7 min-h-[36px] text-xs sm:text-sm text-white/80 transition-all duration-150 hover:border-white/30 hover:bg-white/[0.12] hover:text-white active:scale-95"
            >
              <Bookmark className="h-3 w-3 shrink-0 text-white/50" />
              <span className="truncate">{saved.query}</span>
              <span className="shrink-0 text-[9px] sm:text-[10px] text-white/40">
                {saved.results.length}
              </span>
            </button>
            <button
              onClick={(e) => handleDeleteSaved(e, saved.id)}
              className="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 rounded p-1 min-h-[28px] min-w-[28px] flex items-center justify-center text-white/30 sm:text-white/0 transition-all sm:group-hover:text-white/40 hover:!text-white/80 hover:bg-white/10"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ));

      case 'repurpose':
        if (repurposeVideos === null) {
          return <p className="text-xs sm:text-sm text-white/40">Loading repurpose list...</p>;
        }
        if (repurposeVideos.length === 0) {
          return (
            <p className="text-xs sm:text-sm text-white/40">No videos saved for repurposing yet</p>
          );
        }
        return repurposeVideos.map((video) => (
          <div key={video.id} className="group relative flex items-center gap-1">
            <button
              onClick={() => onRepurposeSelect?.(video)}
              className="flex items-center gap-1.5 sm:gap-2 max-w-[140px] sm:max-w-[180px] truncate rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 sm:px-3 py-1.5 sm:py-2 min-h-[36px] text-xs sm:text-sm text-white/80 transition-all duration-150 hover:border-emerald-500/50 hover:bg-emerald-500/20 hover:text-white active:scale-95"
            >
              <RefreshCw className="h-3 w-3 shrink-0 text-emerald-400/70" />
              <span className="truncate">{video.title}</span>
            </button>
            {/* Extract Transcript button - only for YouTube */}
            {video.platform === 'youtube' && (
              <button
                onClick={(e) => handleExtractTranscript(e, video)}
                disabled={extractingTranscriptId === video.id}
                className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1.5 min-h-[36px] text-xs text-blue-400 transition-all duration-150 hover:border-blue-500/50 hover:bg-blue-500/20 hover:text-blue-300 active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                title="Extract transcript"
              >
                {extractingTranscriptId === video.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MessageSquareText className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            <button
              onClick={(e) => handleDeleteRepurpose(e, video.id)}
              className="rounded p-1 min-h-[28px] min-w-[28px] flex items-center justify-center text-white/30 transition-all hover:text-white/80 hover:bg-white/10"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ));

      case 'scripts':
        if (scripts === null) {
          return <p className="text-xs sm:text-sm text-white/40">Loading scripts...</p>;
        }
        if (scripts.length === 0) {
          return <p className="text-xs sm:text-sm text-white/40">No scripts created yet</p>;
        }
        return scripts.map((script) => (
          <div key={script.id} className="group relative">
            <button
              onClick={() => onScriptSelect?.(script)}
              className="flex items-center gap-1.5 sm:gap-2 max-w-[160px] sm:max-w-[220px] truncate rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 sm:px-3 py-1.5 sm:py-2 pr-6 sm:pr-7 min-h-[36px] text-xs sm:text-sm text-white/80 transition-all duration-150 hover:border-purple-500/50 hover:bg-purple-500/20 hover:text-white active:scale-95"
            >
              <FileText className="h-3 w-3 shrink-0 text-purple-400/70" />
              <span className="truncate">{script.title}</span>
              <span
                className={`shrink-0 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full ${
                  script.status === 'completed'
                    ? 'bg-green-500/20 text-green-400'
                    : script.status === 'in_progress'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-white/10 text-white/40'
                }`}
              >
                {script.status === 'in_progress' ? 'WIP' : script.status}
              </span>
            </button>
            <button
              onClick={(e) => handleDeleteScript(e, script.id)}
              className="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 rounded p-1 min-h-[28px] min-w-[28px] flex items-center justify-center text-white/30 sm:text-white/0 transition-all sm:group-hover:text-white/40 hover:!text-white/80 hover:bg-white/10"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ));

      default:
        return filteredSearches.map((search) => (
          <div key={search.id} className="group relative">
            <button
              onClick={() => onSearchSelect(search.query, search.platform)}
              className="max-w-[120px] sm:max-w-[180px] truncate rounded-lg border border-white/10 bg-white/5 px-2.5 sm:px-3 py-1.5 sm:py-2 pr-6 sm:pr-7 min-h-[36px] text-xs sm:text-sm text-white/70 transition-all duration-150 hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95"
            >
              {search.query}
            </button>
            <button
              onClick={(e) => handleDeleteHistory(e, search.id)}
              className="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 rounded p-1 min-h-[28px] min-w-[28px] flex items-center justify-center text-white/30 sm:text-white/0 transition-all sm:group-hover:text-white/40 hover:!text-white/80 hover:bg-white/10"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ));
    }
  };

  return (
    <div className="w-full max-w-4xl">
      {/* Header */}
      <h2 className="mb-3 sm:mb-4 text-xs sm:text-sm font-medium text-white/50">
        {getHeaderText()}
      </h2>

      {/* Tabs - horizontally scrollable on mobile */}
      <div className="mb-3 sm:mb-4 flex items-center gap-1 overflow-x-auto scrollbar-hidden pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              // For repurpose and scripts tabs, call parent callback to show full table view
              if (tab.id === 'repurpose' && onRepurposeTabClick) {
                onRepurposeTabClick();
                return;
              }
              if (tab.id === 'scripts' && onScriptsTabClick) {
                onScriptsTabClick();
                return;
              }
              setActiveTab(tab.id);
            }}
            className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 min-h-[36px] text-[10px] sm:text-xs font-medium transition-all duration-150 whitespace-nowrap active:scale-95 ${
              activeTab === tab.id ? 'bg-white text-black' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {renderTabIcon(tab.icon)}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content tiles - responsive height */}
      <div className="flex h-[120px] sm:h-[176px] flex-wrap content-start gap-1.5 sm:gap-2 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
