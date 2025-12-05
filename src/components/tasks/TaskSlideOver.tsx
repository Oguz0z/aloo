'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, ListTodo } from 'lucide-react';
import { toast } from 'sonner';
import type { Task, TaskType, TaskPriority, Lead } from '@/types';
import { TASK_TYPES, TASK_PRIORITIES } from '@/lib/constants';
import { TaskList } from './TaskList';

interface TaskSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  initialLeadId?: string;
  initialLeadName?: string;
}

export function TaskSlideOver({ isOpen, onClose, initialLeadId, initialLeadName }: TaskSlideOverProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('other');
  const [dueAt, setDueAt] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>(initialLeadId);
  const [isSaving, setIsSaving] = useState(false);

  // For lead selector
  const [leads, setLeads] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = initialLeadId
        ? `/api/tasks?leadId=${initialLeadId}&status=all`
        : '/api/tasks?status=all';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch {
      console.error('Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  }, [initialLeadId]);

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

  // Initialize when opening
  useEffect(() => {
    if (isOpen) {
      fetchTasks();
      fetchLeads();
      setSelectedLeadId(initialLeadId);
    }
  }, [isOpen, fetchTasks, fetchLeads, initialLeadId]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('other');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setDueAt(formatDateTimeLocal(tomorrow.toISOString()));
    setPriority('medium');
    setSelectedLeadId(initialLeadId);
    setEditingTask(null);
  };

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
      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = editingTask ? 'PATCH' : 'POST';

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
        fetchTasks();
        resetForm();
        setShowForm(false);
        toast.success(editingTask ? 'Task updated' : 'Task created');
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

  const handleComplete = async (taskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedAt: completed ? new Date().toISOString() : null,
        }),
      });
      if (response.ok) {
        fetchTasks();
        toast.success(completed ? 'Task completed' : 'Task reopened');
      }
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setType(task.type);
    setDueAt(formatDateTimeLocal(task.dueAt));
    setPriority(task.priority);
    setSelectedLeadId(task.leadId);
    setShowForm(true);
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchTasks();
        toast.success('Task deleted');
      }
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleNewTask = () => {
    resetForm();
    setShowForm(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Slide-over Panel */}
      <div className="relative h-full w-full max-w-xl bg-black border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-white/10 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <ListTodo className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-200">
                  {initialLeadName ? `Tasks for ${initialLeadName}` : 'All Tasks'}
                </h2>
                <p className="text-sm text-gray-500">
                  {tasks.filter(t => !t.completedAt).length} pending
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Add Task Button or Form */}
          {!showForm ? (
            <button
              onClick={handleNewTask}
              className="w-full mb-6 py-3 rounded-lg border border-dashed border-white/20 text-gray-500 text-sm hover:border-white/30 hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Task
            </button>
          ) : (
            /* Task Form */
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white/[0.02] border border-white/10 rounded-lg space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-200">
                  {editingTask ? 'Edit Task' : 'New Task'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 outline-none focus:border-white/20"
                autoFocus
              />

              {/* Description */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)..."
                rows={2}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 outline-none focus:border-white/20 resize-none"
              />

              {/* Type & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TaskType)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-white/20"
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t.id} value={t.id} className="bg-zinc-900">
                      {t.label}
                    </option>
                  ))}
                </select>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-white/20"
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id} className="bg-zinc-900">
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-white/20 [color-scheme:dark]"
              />

              {/* Lead Selector (only if not pre-selected) */}
              {!initialLeadId && (
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
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingTask ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          )}

          {/* Task List */}
          <TaskList
            tasks={tasks}
            isLoading={isLoading}
            onComplete={handleComplete}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showCompleted={true}
          />
        </div>
      </div>
    </div>
  );
}
