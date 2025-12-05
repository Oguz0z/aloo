'use client';

import { Flame, Snowflake, Sparkles } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/Table';
import { StatusBadge } from './StatusBadge';
import { TagBadge } from './TagBadge';
import { LeadsTableActions } from './LeadsTableActions';
import type { Lead } from '@/types';

interface LeadsTableRowProps {
  lead: Lead;
  onLeadClick: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (leadId: string) => void;
}

export function LeadsTableRow({
  lead,
  onLeadClick,
  onDelete,
  isSelected,
  onToggleSelect,
}: LeadsTableRowProps) {
  return (
    <TableRow
      className={`border-white/10 hover:bg-white/[0.02] cursor-pointer ${isSelected ? 'bg-white/[0.04]' : ''}`}
      onClick={() => onLeadClick(lead)}
    >
      {onToggleSelect !== undefined && (
        <TableCell onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={() => onToggleSelect(lead.id)}
            className="w-4 h-4 rounded border-white/20 bg-transparent text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
        </TableCell>
      )}
      <TableCell>
        <div>
          <p className="text-gray-200 font-medium">{lead.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-gray-500 text-sm">{lead.phone || 'No phone'}</span>
            {lead.tags && lead.tags.length > 0 && (
              <div className="flex gap-1">
                {lead.tags.slice(0, 2).map((tag) => (
                  <TagBadge key={tag.id} tag={tag} size="sm" />
                ))}
                {lead.tags.length > 2 && (
                  <span className="text-xs text-gray-500">+{lead.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-gray-400">{lead.address || '-'}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {lead.leadScore >= 55 && (
            <div className="relative">
              <div className="absolute inset-0 blur-sm bg-orange-500/30 rounded-full" />
              <Flame className="relative w-4 h-4 text-orange-400" />
            </div>
          )}
          {lead.leadScore >= 35 && lead.leadScore < 55 && (
            <div className="relative">
              <div className="absolute inset-0 blur-sm bg-amber-500/20 rounded-full" />
              <Sparkles className="relative w-4 h-4 text-amber-400" />
            </div>
          )}
          {lead.leadScore < 35 && (
            <div className="relative">
              <div className="absolute inset-0 blur-sm bg-blue-500/20 rounded-full" />
              <Snowflake className="relative w-4 h-4 text-blue-400" />
            </div>
          )}
          <span className={`font-mono ${
            lead.leadScore >= 55 ? 'text-orange-300' :
            lead.leadScore >= 35 ? 'text-amber-300' : 'text-blue-300'
          }`}>
            {lead.leadScore}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={lead.status} />
      </TableCell>
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <LeadsTableActions lead={lead} onView={onLeadClick} onDelete={onDelete} />
      </TableCell>
    </TableRow>
  );
}
