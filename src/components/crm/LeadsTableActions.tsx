'use client';

import { MoreHorizontal, Eye, Edit, Trash2, Phone, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Lead } from '@/types';

interface LeadsTableActionsProps {
  lead: Lead;
  onView: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
}

export function LeadsTableActions({ lead, onView, onDelete }: LeadsTableActionsProps) {
  const handleCall = () => {
    if (lead.phone) {
      window.open(`tel:${lead.phone}`, '_self');
    }
  };

  const handleWebsite = () => {
    if (lead.website) {
      window.open(lead.website, '_blank');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-black border-white/10">
        <DropdownMenuItem
          onClick={() => onView(lead)}
          className="text-gray-300 focus:bg-white/5 focus:text-white cursor-pointer"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onView(lead)}
          className="text-gray-300 focus:bg-white/5 focus:text-white cursor-pointer"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        {lead.phone && (
          <DropdownMenuItem
            onClick={handleCall}
            className="text-gray-300 focus:bg-white/5 focus:text-white cursor-pointer"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call
          </DropdownMenuItem>
        )}
        {lead.website && (
          <DropdownMenuItem
            onClick={handleWebsite}
            className="text-gray-300 focus:bg-white/5 focus:text-white cursor-pointer"
          >
            <Globe className="w-4 h-4 mr-2" />
            Website
          </DropdownMenuItem>
        )}
        {(lead.phone || lead.website) && (
          <DropdownMenuSeparator className="bg-white/10" />
        )}
        <DropdownMenuItem
          onClick={() => onDelete(lead.id)}
          className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
