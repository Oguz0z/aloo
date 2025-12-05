'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ListTodo, Plus, ChevronRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Task, TaskStats } from '@/types';

interface TasksDropdownProps {
  onTasksChange?: () => void;
  onOpenSlideOver?: () => void;
}

export function TasksDropdown({ onTasksChange, onOpenSlideOver }: TasksDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tasks?status=pending');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
        setStats(data.stats);
      }
    } catch {
      console.error('Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount and when dropdown opens
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen, fetchTasks]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle task completion from dropdown
  const handleComplete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        fetchTasks();
        onTasksChange?.();
        toast.success('Task completed');
      }
    } catch {
      toast.error('Failed to update task');
    }
  };

  // Get display tasks (overdue + today, max 5)
  const displayTasks = tasks.slice(0, 5);
  const pendingCount = stats?.pending || 0;
  const overdueCount = stats?.overdue || 0;

  return (
    <>
      <div ref={dropdownRef} className="relative">
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-2 rounded-lg transition-colors ${
            isOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ListTodo className="w-5 h-5" />
          {pendingCount > 0 && (
            <span
              className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-medium rounded-full ${
                overdueCount > 0 ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
              }`}
            >
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-white">Tasks</h3>
                {overdueCount > 0 && (
                  <span className="text-xs text-red-400">{overdueCount} overdue</span>
                )}
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSlideOver?.();
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
              >
                <Plus className="w-3 h-3" />
                New
              </button>
            </div>

            {/* Tasks Preview */}
            <div className="p-2 max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
                  ))}
                </div>
              ) : displayTasks.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-sm text-gray-400">All caught up!</p>
                  <p className="text-xs text-gray-600 mt-1">No pending tasks</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {displayTasks.map((task) => {
                    const dueDate = new Date(task.dueAt);
                    const now = new Date();
                    const isOverdue = dueDate < now;
                    const isToday = dueDate.toDateString() === now.toDateString();

                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 group"
                      >
                        <button
                          onClick={() => handleComplete(task.id)}
                          className="flex-shrink-0 w-4 h-4 rounded border border-gray-600 hover:border-gray-400 transition-colors"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 truncate">{task.title}</p>
                          <p
                            className={`text-xs ${
                              isOverdue
                                ? 'text-red-400'
                                : isToday
                                  ? 'text-orange-400'
                                  : 'text-gray-500'
                            }`}
                          >
                            {dueDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSlideOver?.();
                }}
                className="flex items-center justify-center gap-1 w-full py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                View all tasks
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
