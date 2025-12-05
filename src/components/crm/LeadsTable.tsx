'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { LeadsTableRow } from './LeadsTableRow';
import { EmptyState } from './EmptyState';
import type { Lead } from '@/types';

type SortField = 'savedAt' | 'leadScore' | 'name' | 'nextFollowUpAt';
type SortOrder = 'asc' | 'desc';

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  onLeadClick: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  selectedLeadIds?: Set<string>;
  onToggleSelect?: (leadId: string) => void;
  onSelectAll?: () => void;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  onSortChange?: (field: SortField) => void;
}

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="text-gray-500">Name</TableHead>
          <TableHead className="text-gray-500">Location</TableHead>
          <TableHead className="text-gray-500">Score</TableHead>
          <TableHead className="text-gray-500">Status</TableHead>
          <TableHead className="text-gray-500 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i} className="border-white/10">
            <td className="p-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24 mt-1" />
            </td>
            <td className="p-4">
              <Skeleton className="h-4 w-24" />
            </td>
            <td className="p-4">
              <Skeleton className="h-4 w-8" />
            </td>
            <td className="p-4">
              <Skeleton className="h-4 w-16" />
            </td>
            <td className="p-4 text-right">
              <Skeleton className="h-6 w-6 ml-auto" />
            </td>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function LeadsTable({
  leads,
  isLoading,
  onLeadClick,
  onDelete,
  selectedLeadIds,
  onToggleSelect,
  onSelectAll,
  sortBy = 'savedAt',
  sortOrder = 'desc',
  onSortChange,
}: LeadsTableProps) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (leads.length === 0) {
    return <EmptyState />;
  }

  const hasSelection = selectedLeadIds !== undefined && onToggleSelect !== undefined;
  const allSelected = hasSelection && leads.length > 0 && leads.every((l) => selectedLeadIds.has(l.id));
  const someSelected = hasSelection && leads.some((l) => selectedLeadIds.has(l.id));

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          {hasSelection && (
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected;
                }}
                onChange={onSelectAll}
                className="w-4 h-4 rounded border-white/20 bg-transparent text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
            </TableHead>
          )}
          <TableHead className="text-gray-500">Name</TableHead>
          <TableHead className="text-gray-500">Location</TableHead>
          <TableHead className="text-gray-500">
            {onSortChange ? (
              <button
                onClick={() => onSortChange('leadScore')}
                className="flex items-center gap-1 hover:text-gray-300 transition-colors"
              >
                Score
                {sortBy === 'leadScore' ? (
                  sortOrder === 'desc' ? (
                    <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUp className="w-3 h-3" />
                  )
                ) : (
                  <ArrowDown className="w-3 h-3 opacity-30" />
                )}
              </button>
            ) : (
              'Score'
            )}
          </TableHead>
          <TableHead className="text-gray-500">Status</TableHead>
          <TableHead className="text-gray-500 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <LeadsTableRow
            key={lead.id}
            lead={lead}
            onLeadClick={onLeadClick}
            onDelete={onDelete}
            isSelected={selectedLeadIds?.has(lead.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </TableBody>
    </Table>
  );
}
