'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Filter } from 'lucide-react';
import { toast } from 'sonner';
import {
  CRMLayout,
  CRMHeader,
  CRMTabs,
  TabsContent,
  MetricsRow,
  LeadsTable,
  KanbanBoard,
  FilterSidebar,
  defaultFilters,
  TagManager,
} from '@/components/crm';
import type { TabValue, FilterState, ViewMode } from '@/components/crm';
import { LeadDetailModal } from '@/components/leads';
import type { Lead, PipelineStats, LeadStatus } from '@/types';

// LocalStorage key for view preference
const VIEW_MODE_KEY = 'crm-view-mode';

export default function CRMPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // View mode state with LocalStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Data state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  // Modal state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  // Load view mode from LocalStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null;
    if (savedViewMode && (savedViewMode === 'list' || savedViewMode === 'kanban')) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Handle view mode change with LocalStorage persistence
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  }, []);

  // Fetch leads with filters and tab
  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      // Tab-based status filtering
      if (activeTab === 'won') {
        params.set('statuses', 'won');
      } else if (activeTab === 'lost') {
        params.set('statuses', 'lost');
      } else if (activeTab === 'pipeline') {
        params.set('statuses', 'contacted,called,proposal_sent,negotiating');
      } else if (filters.statuses.length > 0) {
        params.set('statuses', filters.statuses.join(','));
      }

      // Score range
      if (filters.scoreRange.min > 0) {
        params.set('minScore', filters.scoreRange.min.toString());
      }
      if (filters.scoreRange.max < 100) {
        params.set('maxScore', filters.scoreRange.max.toString());
      }

      // Industries filter
      if (filters.industries.length > 0) {
        params.set('industries', filters.industries.join(','));
      }

      // Tags filter
      if (filters.tags.length > 0) {
        params.set('tags', filters.tags.join(','));
      }

      // Follow-up filter
      if (filters.followUp !== 'all') {
        params.set('followUp', filters.followUp);
      }

      // Sorting
      params.set('sortBy', filters.sortBy);
      params.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/leads?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      }
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, filters]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/leads/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch {
      console.error('Failed to fetch stats');
    }
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [fetchLeads, fetchStats]);

  // Filter leads by search query
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;

    const query = searchQuery.toLowerCase();
    return leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(query) ||
        lead.address?.toLowerCase().includes(query) ||
        lead.phone?.toLowerCase().includes(query) ||
        lead.notes?.toLowerCase().includes(query)
    );
  }, [leads, searchQuery]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = stats?.total || 0;
    const won = stats?.byStatus?.won || 0;
    const inProgress =
      (stats?.byStatus?.contacted || 0) +
      (stats?.byStatus?.called || 0) +
      (stats?.byStatus?.proposal_sent || 0) +
      (stats?.byStatus?.negotiating || 0);
    const conversionRate = stats?.conversionRate || 0;
    return { total, won, inProgress, conversionRate };
  }, [stats]);

  // Delete lead
  const handleDeleteLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
        fetchStats();
        toast.success('Lead deleted');
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  // Handle lead click
  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  // Update lead from modal
  const handleLeadUpdate = (updatedLead: Lead) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
    );
    setSelectedLead(updatedLead);
    fetchStats();
  };

  // Handle status change from Kanban drag & drop
  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    // Optimistically update UI
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      )
    );

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchStats();
        toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      } else {
        // Revert on failure
        fetchLeads();
        toast.error('Failed to update status');
      }
    } catch {
      fetchLeads();
      toast.error('Failed to update status');
    }
  };

  return (
    <CRMLayout>
      {/* Header */}
      <CRMHeader
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Tabs */}
      <div className="mt-6">
        <CRMTabs activeTab={activeTab} onTabChange={setActiveTab}>
          <TabsContent value={activeTab} className="mt-6">
            {/* Metrics */}
            <MetricsRow
              total={metrics.total}
              inProgress={metrics.inProgress}
              won={metrics.won}
              conversionRate={metrics.conversionRate}
              isLoading={isLoading && !stats}
            />

            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setIsFilterSidebarOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
                {(filters.statuses.length > 0 ||
                  filters.industries.length > 0 ||
                  filters.tags.length > 0 ||
                  filters.scoreRange.min > 0 ||
                  filters.scoreRange.max < 100 ||
                  filters.followUp !== 'all') && (
                  <span className="w-2 h-2 rounded-full bg-white/50" />
                )}
              </button>
            </div>

            {/* Content with Sidebar */}
            {viewMode === 'kanban' ? (
              /* Kanban View - Full width */
              <div>
                {searchQuery && (
                  <div className="text-sm text-gray-500 mb-4">
                    Showing {filteredLeads.length} of {leads.length} leads
                  </div>
                )}
                <KanbanBoard
                  leads={filteredLeads}
                  isLoading={isLoading}
                  onLeadClick={handleLeadClick}
                  onDelete={handleDeleteLead}
                  onStatusChange={handleStatusChange}
                />
              </div>
            ) : (
              /* List View with Sidebar */
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-3">
                  {searchQuery && (
                    <div className="text-sm text-gray-500 mb-4">
                      Showing {filteredLeads.length} of {leads.length} leads
                    </div>
                  )}
                  <LeadsTable
                    leads={filteredLeads}
                    isLoading={isLoading}
                    onLeadClick={handleLeadClick}
                    onDelete={handleDeleteLead}
                  />
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <FilterSidebar
                    filters={filters}
                    onFiltersChange={setFilters}
                    isOpen={isFilterSidebarOpen}
                    onClose={() => setIsFilterSidebarOpen(false)}
                    leadCount={filteredLeads.length}
                    onOpenTagManager={() => setIsTagManagerOpen(true)}
                  />
                </div>
              </div>
            )}
          </TabsContent>
        </CRMTabs>
      </div>

      {/* Lead Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={handleLeadUpdate}
      />

      {/* Tag Manager Modal */}
      <TagManager
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
      />
    </CRMLayout>
  );
}
