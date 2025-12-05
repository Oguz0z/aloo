'use client';

import { LEAD_STATUSES } from '@/lib/constants';
import type { LeadStatus } from '@/types';

interface LeadStatusBadgeProps {
  status: LeadStatus;
  size?: 'sm' | 'md';
}

export function LeadStatusBadge({ status, size = 'md' }: LeadStatusBadgeProps) {
  const statusConfig = LEAD_STATUSES.find((s) => s.id === status);

  if (!statusConfig) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-400 ${sizeClasses[size]}`}
    >
      {statusConfig.label}
    </span>
  );
}
