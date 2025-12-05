'use client';

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

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  onLeadClick: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
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
}: LeadsTableProps) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (leads.length === 0) {
    return <EmptyState />;
  }

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
        {leads.map((lead) => (
          <LeadsTableRow
            key={lead.id}
            lead={lead}
            onLeadClick={onLeadClick}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
