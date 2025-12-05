'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Phone,
  Globe,
  MapPin,
  Star,
  MessageSquare,
  Calendar,
  Mail,
  Users,
  StickyNote,
  Clock,
  Send,
  Plus,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { CONTACT_TYPES, OUTCOMES } from '@/lib/constants';
import { LeadScoreBadge } from './LeadScoreBadge';
import { StatusBadge } from '@/components/crm';
import { StatusSelector } from './StatusSelector';
import { OpportunitiesList } from './OpportunitiesList';
import { TaskList, TaskModal } from '@/components/tasks';
import type { Lead, LeadStatus, ContactLogEntry, Task } from '@/types';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedLead: Lead) => void;
}

export function LeadDetailModal({ lead, isOpen, onClose, onUpdate }: LeadDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'tasks' | 'notes'>('details');
  const [contactLogs, setContactLogs] = useState<ContactLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);

  // New contact log form
  const [showAddLog, setShowAddLog] = useState(false);
  const [newLogType, setNewLogType] = useState('call');
  const [newLogSummary, setNewLogSummary] = useState('');
  const [newLogOutcome, setNewLogOutcome] = useState('neutral');
  const [isAddingLog, setIsAddingLog] = useState(false);

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Load contact logs
  const fetchContactLogs = useCallback(async () => {
    if (!lead) return;
    setIsLoadingLogs(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/contact`);
      if (response.ok) {
        const data = await response.json();
        setContactLogs(data.contactLogs || []);
      }
    } catch {
      console.error('Failed to fetch contact logs');
    } finally {
      setIsLoadingLogs(false);
    }
  }, [lead]);

  // Load tasks for this lead
  const fetchTasks = useCallback(async () => {
    if (!lead) return;
    setIsLoadingTasks(true);
    try {
      const response = await fetch(`/api/tasks?leadId=${lead.id}&status=all`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch {
      console.error('Failed to fetch tasks');
    } finally {
      setIsLoadingTasks(false);
    }
  }, [lead]);

  // Initialize state when lead changes
  useEffect(() => {
    if (lead && isOpen) {
      setNotes(lead.notes || '');
      setFollowUpDate(lead.nextFollowUpAt ? lead.nextFollowUpAt.split('T')[0] : '');
      fetchContactLogs();
      fetchTasks();
    }
  }, [lead, isOpen, fetchContactLogs, fetchTasks]);

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

  if (!isOpen || !lead) return null;

  // Update status
  const handleUpdateStatus = async (status: LeadStatus) => {
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        onUpdate({ ...lead, status });
        toast.success('Status updated');
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Save notes
  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (response.ok) {
        onUpdate({ ...lead, notes });
        toast.success('Notes saved');
      }
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Save follow-up date
  const handleSaveFollowUp = async () => {
    setIsSavingFollowUp(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextFollowUpAt: followUpDate || null }),
      });
      if (response.ok) {
        onUpdate({ ...lead, nextFollowUpAt: followUpDate || undefined });
        toast.success(followUpDate ? 'Follow-up set' : 'Follow-up cleared');
      }
    } catch {
      toast.error('Failed to save follow-up');
    } finally {
      setIsSavingFollowUp(false);
    }
  };

  // Add contact log
  const handleAddLog = async () => {
    if (!newLogSummary.trim()) {
      toast.error('Please enter a summary');
      return;
    }
    setIsAddingLog(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newLogType,
          summary: newLogSummary,
          outcome: newLogOutcome,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setContactLogs((prev) => [data.contactLog, ...prev]);
        setNewLogSummary('');
        setShowAddLog(false);
        onUpdate({ ...lead, lastContactedAt: new Date().toISOString() });
        toast.success('Contact log added');
      }
    } catch {
      toast.error('Failed to add contact log');
    } finally {
      setIsAddingLog(false);
    }
  };

  // Task handlers
  const handleTaskComplete = async (taskId: string, completed: boolean) => {
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

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskDelete = async (taskId: string) => {
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

  const handleTaskSave = () => {
    fetchTasks();
    setEditingTask(null);
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'meeting':
        return <Users className="w-4 h-4" />;
      case 'note':
        return <StickyNote className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'positive':
        return 'text-green-400';
      case 'negative':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Slide-over Panel */}
      <div className="relative h-full w-full max-w-2xl bg-black border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-white/10 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-gray-200 truncate">{lead.name}</h2>
                <StatusBadge status={lead.status} />
              </div>
              {lead.address && (
                <p className="text-sm text-gray-500 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {lead.address}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <LeadScoreBadge score={lead.leadScore} />
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors"
              >
                <Phone className="w-4 h-4" />
                {lead.phone}
              </a>
            )}
            {lead.website && (
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors"
              >
                <Globe className="w-4 h-4" />
                Website
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {lead.mapsUrl && (
              <a
                href={lead.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 border-b border-white/10">
          <div className="flex">
            {(['details', 'activity', 'tasks', 'notes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab === 'details' && 'Details'}
                {tab === 'activity' && `Contacts (${contactLogs.length})`}
                {tab === 'tasks' && `Tasks (${tasks.filter((t) => !t.completedAt).length})`}
                {tab === 'notes' && 'Notes'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Status */}
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Status</label>
                <StatusSelector value={lead.status} onChange={handleUpdateStatus} />
              </div>

              {/* Follow-up */}
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Follow-up Date</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-white/20"
                  />
                  <button
                    onClick={handleSaveFollowUp}
                    disabled={isSavingFollowUp}
                    className="px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-gray-200 text-sm font-medium hover:bg-white/10 disabled:opacity-50 transition-colors"
                  >
                    {isSavingFollowUp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set'}
                  </button>
                </div>
                {lead.nextFollowUpAt && (
                  <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Currently set: {new Date(lead.nextFollowUpAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                {lead.rating && (
                  <div className="bg-white/[0.02] border border-white/10 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Rating</p>
                    <p className="text-lg font-semibold text-gray-200 flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500" />
                      {lead.rating.toFixed(1)}
                    </p>
                  </div>
                )}
                {lead.reviewCount !== undefined && (
                  <div className="bg-white/[0.02] border border-white/10 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Reviews</p>
                    <p className="text-lg font-semibold text-gray-200 flex items-center gap-1">
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                      {lead.reviewCount}
                    </p>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Saved</span>
                  <span className="text-gray-300">{formatDate(lead.savedAt)}</span>
                </div>
                {lead.lastContactedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Contacted</span>
                    <span className="text-gray-300">{formatDate(lead.lastContactedAt)}</span>
                  </div>
                )}
              </div>

              {/* Opportunities */}
              {lead.opportunities && lead.opportunities.length > 0 && (
                <div>
                  <OpportunitiesList opportunities={lead.opportunities} maxVisible={10} />
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* Add Log Button */}
              {!showAddLog ? (
                <button
                  onClick={() => setShowAddLog(true)}
                  className="w-full py-3 rounded-lg border border-dashed border-white/20 text-gray-500 text-sm hover:border-white/30 hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Contact Log
                </button>
              ) : (
                /* Add Log Form */
                <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-200">New Contact Log</h4>
                    <button
                      onClick={() => setShowAddLog(false)}
                      className="text-gray-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Type</label>
                      <select
                        value={newLogType}
                        onChange={(e) => setNewLogType(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-white/20"
                      >
                        {CONTACT_TYPES.map((type) => (
                          <option key={type.id} value={type.id} className="bg-black">
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Outcome</label>
                      <select
                        value={newLogOutcome}
                        onChange={(e) => setNewLogOutcome(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-white/20"
                      >
                        {OUTCOMES.map((outcome) => (
                          <option key={outcome.id} value={outcome.id} className="bg-black">
                            {outcome.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Summary</label>
                    <textarea
                      value={newLogSummary}
                      onChange={(e) => setNewLogSummary(e.target.value)}
                      placeholder="What happened?"
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none resize-none focus:border-white/20 placeholder-gray-600"
                    />
                  </div>

                  <button
                    onClick={handleAddLog}
                    disabled={isAddingLog || !newLogSummary.trim()}
                    className="w-full py-2 rounded-lg border border-white/20 bg-white/5 text-gray-200 text-sm font-medium hover:bg-white/10 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isAddingLog ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Add Log
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Contact Logs List */}
              {isLoadingLogs ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                </div>
              ) : contactLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No contact history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contactLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-white/[0.02] border border-white/10 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg bg-white/5 ${getOutcomeColor(log.outcome)}`}
                        >
                          {getContactIcon(log.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-200 capitalize">
                              {log.type}
                            </span>
                            {log.outcome && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border ${
                                  log.outcome === 'positive'
                                    ? 'border-green-500/30 text-green-400'
                                    : log.outcome === 'negative'
                                      ? 'border-red-500/30 text-red-400'
                                      : 'border-white/10 text-gray-500'
                                }`}
                              >
                                {log.outcome}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">{log.summary}</p>
                          <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {/* Add Task Button */}
              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
                className="w-full py-3 rounded-lg border border-dashed border-white/20 text-gray-500 text-sm hover:border-white/30 hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Task for {lead.name}
              </button>

              {/* Task List */}
              <TaskList
                tasks={tasks}
                isLoading={isLoadingTasks}
                onComplete={handleTaskComplete}
                onEdit={handleTaskEdit}
                onDelete={handleTaskDelete}
                showCompleted={true}
              />

              {/* Task Modal */}
              <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => {
                  setIsTaskModalOpen(false);
                  setEditingTask(null);
                }}
                onSave={handleTaskSave}
                task={editingTask}
                leadId={lead.id}
                leadName={lead.name}
              />
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this lead..."
                rows={12}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-200 outline-none resize-none focus:border-white/20 placeholder-gray-600"
              />
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes || notes === (lead.notes || '')}
                className="w-full py-3 rounded-lg border border-white/20 bg-white/5 text-gray-200 text-sm font-medium hover:bg-white/10 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSavingNotes ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <StickyNote className="w-4 h-4" />
                    Save Notes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
