'use client';

import { LEAD_STATUSES } from '@/lib/constants';
import type { LeadStatus } from '@/types';

interface StatusSelectorProps {
  value: LeadStatus;
  onChange: (status: LeadStatus) => void;
  disabled?: boolean;
}

export function StatusSelector({ value, onChange, disabled }: StatusSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as LeadStatus)}
      disabled={disabled}
      className="text-sm rounded-lg px-3 py-1.5 border border-white/10 bg-white/5 text-gray-300 outline-none cursor-pointer transition-colors hover:bg-white/10 focus:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {LEAD_STATUSES.map((status) => (
        <option key={status.id} value={status.id} className="bg-black text-gray-300">
          {status.label}
        </option>
      ))}
    </select>
  );
}
