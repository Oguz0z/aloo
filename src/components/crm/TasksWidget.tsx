'use client';

import { useState, useEffect, useCallback } from 'react';
import { ListTodo, AlertTriangle, ChevronRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Task } from '@/types';

interface TasksWidgetProps {
  onOpenSlideOver: () => void;
}

export function TasksWidget({ onOpenSlideOver }: TasksWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks?status=pending');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch {
      console.error('Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleComplete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedAt: new Date().toISOString() }),
      });
      if (response.ok) {
        fetchTasks();
        toast.success('Task completed');
      }
    } catch {
      toast.error('Failed to complete task');
    }
  };

  // Kategorisiere Tasks
  const now = new Date();
  const overdueTasks = tasks.filter((t) => new Date(t.dueAt) < now);

  // Zeige alle pending Tasks (max 4)
  const displayTasks = tasks.slice(0, 4);
  const hasMore = tasks.length > 4;

  // Nichts anzeigen wenn keine Tasks vorhanden
  if (!isLoading && tasks.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mb-6 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
        <div className="h-6 w-32 bg-white/5 rounded animate-pulse mb-3" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-white">
            Tasks
            <span className="text-gray-500 font-normal ml-1">({tasks.length})</span>
          </h3>
          {overdueTasks.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
              <AlertTriangle className="w-3 h-3" />
              {overdueTasks.length} overdue
            </span>
          )}
        </div>
        <button
          onClick={onOpenSlideOver}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
        >
          View all
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {displayTasks.map((task) => {
          const dueDate = new Date(task.dueAt);
          const isOverdue = dueDate < now;

          return (
            <div
              key={task.id}
              onClick={onOpenSlideOver}
              className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-white/[0.04] hover:border-white/10 transition-colors cursor-pointer group"
            >
              {/* Checkbox */}
              <button
                onClick={(e) => handleComplete(task.id, e)}
                className="flex-shrink-0 w-5 h-5 rounded border border-gray-600 hover:border-green-500 hover:bg-green-500/20 transition-colors flex items-center justify-center group/check"
              >
                <Check className="w-3 h-3 text-green-500 opacity-0 group-hover/check:opacity-100 transition-opacity" />
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-xs ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}
                  >
                    {dueDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                  {task.lead && (
                    <span className="text-xs text-gray-600 truncate">
                      • {task.lead.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Priority indicator */}
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  task.priority === 'urgent'
                    ? 'bg-red-500'
                    : task.priority === 'high'
                      ? 'bg-orange-500'
                      : task.priority === 'medium'
                        ? 'bg-blue-500'
                        : 'bg-gray-500'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Show more hint */}
      {hasMore && (
        <button
          onClick={onOpenSlideOver}
          className="w-full mt-2 py-2 text-xs text-gray-500 hover:text-white transition-colors"
        >
          + {tasks.length - 4} more tasks
        </button>
      )}
    </div>
  );
}
