'use client';

import { useState, useEffect } from 'react';
import {
  Trash2,
  Tag,
  RefreshCw,
  Download,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { LEAD_STATUSES } from '@/lib/constants';
import type { Lead, LeadStatus, Tag as TagType } from '@/types';

interface BulkActionsProps {
  selectedLeads: Lead[];
  onClearSelection: () => void;
  onBulkUpdate: () => void;
}

export function BulkActions({ selectedLeads, onClearSelection, onBulkUpdate }: BulkActionsProps) {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [availableTags, setAvailableTags] = useState<TagType[]>([]);

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/tags');
        if (res.ok) {
          const data = await res.json();
          setAvailableTags(data.tags || []);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };
    fetchTags();
  }, []);

  const handleBulkStatusChange = async (status: LeadStatus) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/leads/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: selectedLeads.map((l) => l.id),
          action: 'status',
          status,
        }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success(`Updated ${selectedLeads.length} leads to "${status}"`);
      setIsStatusOpen(false);
      onClearSelection();
      onBulkUpdate();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkAddTag = async (tagId: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/leads/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: selectedLeads.map((l) => l.id),
          action: 'add_tag',
          tagId,
        }),
      });

      if (!res.ok) throw new Error('Failed to add tag');

      const tag = availableTags.find((t) => t.id === tagId);
      toast.success(`Added "${tag?.name}" to ${selectedLeads.length} leads`);
      setIsTagsOpen(false);
      onClearSelection();
      onBulkUpdate();
    } catch {
      toast.error('Failed to add tag');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedLeads.length} leads? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch('/api/leads/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: selectedLeads.map((l) => l.id),
        }),
      });

      if (!res.ok) throw new Error('Failed to delete leads');

      toast.success(`Deleted ${selectedLeads.length} leads`);
      onClearSelection();
      onBulkUpdate();
    } catch {
      toast.error('Failed to delete leads');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const csvContent = generateCSV(selectedLeads);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${selectedLeads.length} leads to CSV`);
    } catch {
      toast.error('Failed to export leads');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 border border-white/20 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-200">
          {selectedLeads.length} selected
        </span>
        <button
          onClick={onClearSelection}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="w-px h-6 bg-white/20" />

      {/* Status Change */}
      <div className="relative">
        <button
          onClick={() => {
            setIsStatusOpen(!isStatusOpen);
            setIsTagsOpen(false);
          }}
          disabled={isUpdating}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" />
          Status
        </button>

        {isStatusOpen && (
          <div className="absolute bottom-full mb-2 left-0 bg-gray-900 border border-white/20 rounded-lg shadow-xl p-2 min-w-[160px]">
            {LEAD_STATUSES.map((status) => (
              <button
                key={status.id}
                onClick={() => handleBulkStatusChange(status.id)}
                disabled={isUpdating}
                className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 opacity-0" />
                )}
                {status.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add Tag */}
      <div className="relative">
        <button
          onClick={() => {
            setIsTagsOpen(!isTagsOpen);
            setIsStatusOpen(false);
          }}
          disabled={isUpdating || availableTags.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 text-sm transition-colors disabled:opacity-50"
        >
          <Tag className="w-4 h-4" />
          Add Tag
        </button>

        {isTagsOpen && availableTags.length > 0 && (
          <div className="absolute bottom-full mb-2 left-0 bg-gray-900 border border-white/20 rounded-lg shadow-xl p-2 min-w-[160px] max-h-64 overflow-y-auto">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleBulkAddTag(tag.id)}
                disabled={isUpdating}
                className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Export CSV */}
      <button
        onClick={handleExportCSV}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 text-sm transition-colors disabled:opacity-50"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Export
      </button>

      <div className="w-px h-6 bg-white/20" />

      {/* Delete */}
      <button
        onClick={handleBulkDelete}
        disabled={isDeleting}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-colors disabled:opacity-50"
      >
        {isDeleting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
        Delete
      </button>
    </div>
  );
}

// Helper function to generate CSV
function generateCSV(leads: Lead[]): string {
  const headers = [
    'Name',
    'Address',
    'Phone',
    'Website',
    'Rating',
    'Reviews',
    'Lead Score',
    'Status',
    'Industry',
    'Tags',
    'Notes',
    'Saved At',
    'Last Contacted',
    'Next Follow-up',
  ];

  const rows = leads.map((lead) => [
    escapeCsvField(lead.name),
    escapeCsvField(lead.address || ''),
    escapeCsvField(lead.phone || ''),
    escapeCsvField(lead.website || ''),
    lead.rating?.toString() || '',
    lead.reviewCount?.toString() || '',
    lead.leadScore.toString(),
    lead.status,
    lead.industryType || '',
    escapeCsvField(lead.tags?.map((t) => t.name).join(', ') || ''),
    escapeCsvField(lead.notes || ''),
    lead.savedAt,
    lead.lastContactedAt || '',
    lead.nextFollowUpAt || '',
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
