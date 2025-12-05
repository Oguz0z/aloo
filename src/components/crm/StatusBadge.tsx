'use client';

import type { LeadStatus } from '@/types';

const statusStyles: Record<LeadStatus, string> = {
  new: 'text-gray-400',
  contacted: 'text-gray-300',
  called: 'text-gray-300',
  proposal_sent: 'text-gray-200',
  negotiating: 'text-gray-200',
  won: 'text-green-400',
  lost: 'text-gray-600',
  not_interested: 'text-gray-600',
};

const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  called: 'Called',
  proposal_sent: 'Proposal',
  negotiating: 'Negotiating',
  won: 'Won',
  lost: 'Lost',
  not_interested: 'Not Interested',
};

interface StatusBadgeProps {
  status: LeadStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`text-xs font-medium ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
