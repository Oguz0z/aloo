'use client';

import { Droppable } from '@hello-pangea/dnd';
import { KanbanCard } from './KanbanCard';
import type { Lead, LeadStatus } from '@/types';

interface KanbanColumnProps {
  status: LeadStatus;
  label: string;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
}

export function KanbanColumn({
  status,
  label,
  leads,
  onLeadClick,
  onDelete,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-72 min-w-[288px] bg-white/[0.02] rounded-xl border border-white/10">
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-300">{label}</h3>
          <span className="text-xs font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
            {leads.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 overflow-y-auto min-h-[200px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-white/[0.03]' : ''
            }`}
          >
            {leads.map((lead, index) => (
              <KanbanCard
                key={lead.id}
                lead={lead}
                index={index}
                onLeadClick={onLeadClick}
                onDelete={onDelete}
              />
            ))}
            {provided.placeholder}

            {/* Empty state */}
            {leads.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-24 text-gray-600 text-sm">
                No leads
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
