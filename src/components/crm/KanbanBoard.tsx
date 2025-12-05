'use client';

import { useMemo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import type { Lead, LeadStatus } from '@/types';

// Define the pipeline stages for Kanban (excluding won/lost - those are end states)
const KANBAN_STAGES: { status: LeadStatus; label: string }[] = [
  { status: 'new', label: 'New' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'called', label: 'Called' },
  { status: 'proposal_sent', label: 'Proposal Sent' },
  { status: 'negotiating', label: 'Negotiating' },
  { status: 'won', label: 'Won' },
  { status: 'lost', label: 'Lost' },
];

interface KanbanBoardProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => Promise<void>;
  isLoading?: boolean;
}

export function KanbanBoard({
  leads,
  onLeadClick,
  onDelete,
  onStatusChange,
  isLoading,
}: KanbanBoardProps) {
  // Group leads by status
  const leadsByStatus = useMemo(() => {
    const grouped: Record<LeadStatus, Lead[]> = {
      new: [],
      contacted: [],
      called: [],
      proposal_sent: [],
      negotiating: [],
      won: [],
      lost: [],
      not_interested: [],
    };

    leads.forEach((lead) => {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      }
    });

    return grouped;
  }, [leads]);

  // Handle drag end
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Get the new status from the destination column
    const newStatus = destination.droppableId as LeadStatus;

    // Update the lead status
    await onStatusChange(draggableId, newStatus);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_STAGES.map((stage) => (
          <div
            key={stage.status}
            className="flex flex-col w-72 min-w-[288px] bg-white/[0.02] rounded-xl border border-white/10"
          >
            <div className="px-4 py-3 border-b border-white/10">
              <div className="h-5 w-24 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="p-2 space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-white/[0.03] rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        {KANBAN_STAGES.map((stage) => (
          <KanbanColumn
            key={stage.status}
            status={stage.status}
            label={stage.label}
            leads={leadsByStatus[stage.status] || []}
            onLeadClick={onLeadClick}
            onDelete={onDelete}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
