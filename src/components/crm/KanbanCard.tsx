'use client';

import { Draggable } from '@hello-pangea/dnd';
import { Phone, Globe, MapPin, MoreVertical, Trash2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TagBadge } from './TagBadge';
import type { Lead } from '@/types';

interface KanbanCardProps {
  lead: Lead;
  index: number;
  onLeadClick: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
}

export function KanbanCard({ lead, index, onLeadClick, onDelete }: KanbanCardProps) {
  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group bg-white/[0.03] border border-white/10 rounded-lg p-3 mb-2 cursor-grab active:cursor-grabbing transition-all ${
            snapshot.isDragging ? 'shadow-xl shadow-black/20 border-white/20 rotate-2' : ''
          }`}
          onClick={() => onLeadClick(lead)}
        >
          {/* Header with name and actions */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-gray-200 line-clamp-2">{lead.name}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10">
                <DropdownMenuItem
                  className="text-gray-300 focus:bg-white/10 focus:text-white cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLeadClick(lead);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(lead.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Score badge */}
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                lead.leadScore >= 70
                  ? 'bg-green-500/20 text-green-400'
                  : lead.leadScore >= 40
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {lead.leadScore}
            </span>
            <span className="text-xs text-gray-500 capitalize">
              {lead.industryType?.replace('_', ' ') || 'Other'}
            </span>
          </div>

          {/* Contact info */}
          <div className="mt-2 space-y-1">
            {lead.phone && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Phone className="w-3 h-3" />
                <span className="truncate">{lead.phone}</span>
              </div>
            )}
            {lead.website && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Globe className="w-3 h-3" />
                <span className="truncate">{new URL(lead.website).hostname}</span>
              </div>
            )}
            {lead.address && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{lead.address.split(',')[0]}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {lead.tags.slice(0, 3).map((tag) => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))}
              {lead.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{lead.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Notes preview */}
          {lead.notes && (
            <p className="mt-2 text-xs text-gray-600 line-clamp-2">{lead.notes}</p>
          )}
        </div>
      )}
    </Draggable>
  );
}
