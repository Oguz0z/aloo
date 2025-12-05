'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import type { Task, TaskType, TaskPriority, Lead } from '@/types';
import { TASK_TYPES, TASK_PRIORITIES } from '@/lib/constants';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  task?: Task | null;
  leadId?: string;
  leadName?: string;
}

export function TaskModal({ isOpen, onClose, onSave, task, leadId, leadName }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('other');
  const [dueAt, setDueAt] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>(leadId);
  const [isSaving, setIsSaving] = useState(false);

  // For lead selector
  const [leads, setLeads] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  const isEditing = !!task;

  // Fetch leads for selector
  const fetchLeads = useCallback(async () => {
    setIsLoadingLeads(true);
    try {
      const response = await fetch('/api/leads?sortBy=name&sortOrder=asc');
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads.map((l: Lead) => ({ id: l.id, name: l.name })));
      }
    } catch {
      console.error('Failed to load leads');
    } finally {
      setIsLoadingLeads(false);
    }
  }, []);

  // Initialize form when opening
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setType(task.type);
        setDueAt(formatDateTimeLocal(task.dueAt));
        setPriority(task.priority);
        setSelectedLeadId(task.leadId);
      } else {
        setTitle('');
        setDescription('');
        setType('other');
        // Default to tomorrow at 9:00 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        setDueAt(formatDateTimeLocal(tomorrow.toISOString()));
        setPriority('medium');
        setSelectedLeadId(leadId);
      }
      fetchLeads();
    }
  }, [isOpen, task, leadId, fetchLeads]);

  const formatDateTimeLocal = (isoString: string) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!dueAt) {
      toast.error('Due date is required');
      return;
    }

    setIsSaving(true);

    try {
      const url = isEditing ? `/api/tasks/${task.id}` : '/api/tasks';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          dueAt: new Date(dueAt).toISOString(),
          priority,
          leadId: selectedLeadId || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onSave(data.task);
        onClose();
        toast.success(isEditing ? 'Task updated' : 'Task created');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save task');
      }
    } catch {
      toast.error('Failed to save task');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-zinc-900 border border-white/10 rounded-xl w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-medium text-white">
              {isEditing ? 'Edit Task' : 'New Task'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Call about proposal"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 outline-none focus:border-white/20"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes..."
                rows={2}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 outline-none focus:border-white/20 resize-none"
              />
            </div>

            {/* Type & Priority row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TaskType)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-white/20"
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t.id} value={t.id} className="bg-zinc-900">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-white/20"
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id} className="bg-zinc-900">
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Due Date <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-white/20 [color-scheme:dark]"
              />
            </div>

            {/* Lead Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Link to Lead
                {leadName && <span className="text-gray-500 font-normal ml-2">(pre-selected)</span>}
              </label>
              <select
                value={selectedLeadId || ''}
                onChange={(e) => setSelectedLeadId(e.target.value || undefined)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-white/20"
                disabled={isLoadingLeads}
              >
                <option value="" className="bg-zinc-900">
                  No lead (standalone task)
                </option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id} className="bg-zinc-900">
                    {lead.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
