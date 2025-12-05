'use client';

import { Phone, Globe, MapPin, Trash2 } from 'lucide-react';
import {
  LeadScoreBadge,
  LeadStatusBadge,
  StatusSelector,
} from '@/components/leads';
import type { Lead, LeadStatus } from '@/types';

interface LeadsListProps {
  leads: Lead[];
  isLoading: boolean;
  onLeadClick: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onDelete: (leadId: string) => void;
}

export function LeadsList({
  leads,
  isLoading,
  onLeadClick,
  onStatusChange,
  onDelete,
}: LeadsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 animate-pulse"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-700 rounded w-1/4" />
              </div>
              <div className="h-10 w-10 bg-gray-700 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-gray-600" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No leads found</h3>
        <p className="text-gray-400 mb-6">
          Start by searching for businesses to add leads to your CRM.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <div
          key={lead.id}
          onClick={() => onLeadClick(lead)}
          className="bg-white/[0.02] border border-white/10 rounded-xl p-4 sm:p-5 cursor-pointer hover:border-white/20 hover:bg-white/[0.04] transition-all group"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-medium text-gray-200 truncate group-hover:text-white transition-colors">
                      {lead.name}
                    </h3>
                    <LeadStatusBadge status={lead.status} size="sm" />
                  </div>
                  {lead.address && (
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{lead.address}</span>
                    </p>
                  )}
                </div>
                <LeadScoreBadge score={lead.leadScore} />
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap gap-2">
                {lead.phone && (
                  <span
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center"
                  >
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {lead.phone}
                    </a>
                  </span>
                )}
                {lead.website && (
                  <span
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center"
                  >
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Website
                    </a>
                  </span>
                )}
                {lead.nextFollowUpAt && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-500">
                    Follow-up: {new Date(lead.nextFollowUpAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div
              className="lg:w-48 flex flex-row lg:flex-col gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 lg:flex-none">
                <label className="text-xs text-gray-500 mb-1 block">Status</label>
                <StatusSelector
                  value={lead.status}
                  onChange={(status) => onStatusChange(lead.id, status)}
                />
              </div>
              <button
                onClick={() => onDelete(lead.id)}
                className="flex items-center justify-center gap-2 px-3 py-2 lg:py-2 rounded-lg border border-white/10 text-gray-500 text-sm hover:text-gray-300 hover:bg-white/5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="lg:hidden">Delete</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
