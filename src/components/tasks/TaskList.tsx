'use client';

import { useMemo } from 'react';
import { ListTodo } from 'lucide-react';
import type { Task } from '@/types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  onComplete: (taskId: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  showCompleted?: boolean;
}

export function TaskList({
  tasks,
  isLoading,
  onComplete,
  onEdit,
  onDelete,
  showCompleted = false,
}: TaskListProps) {
  const groupedTasks = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

    const overdue: Task[] = [];
    const today: Task[] = [];
    const upcoming: Task[] = [];
    const completed: Task[] = [];

    tasks.forEach((task) => {
      if (task.completedAt) {
        if (showCompleted) completed.push(task);
        return;
      }

      const dueAt = new Date(task.dueAt);
      if (dueAt < startOfDay) {
        overdue.push(task);
      } else if (dueAt <= endOfDay) {
        today.push(task);
      } else {
        upcoming.push(task);
      }
    });

    return { overdue, today, upcoming, completed };
  }, [tasks, showCompleted]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-lg bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const isEmpty =
    groupedTasks.overdue.length === 0 &&
    groupedTasks.today.length === 0 &&
    groupedTasks.upcoming.length === 0 &&
    groupedTasks.completed.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <ListTodo className="w-6 h-6 text-gray-500" />
        </div>
        <h3 className="text-gray-300 font-medium mb-1">No tasks yet</h3>
        <p className="text-sm text-gray-500">Create a task to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overdue */}
      {groupedTasks.overdue.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
            <span>⚠</span>
            Overdue ({groupedTasks.overdue.length})
          </h3>
          <div className="space-y-2">
            {groupedTasks.overdue.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={onComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Today */}
      {groupedTasks.today.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-orange-400 mb-2">
            Today ({groupedTasks.today.length})
          </h3>
          <div className="space-y-2">
            {groupedTasks.today.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={onComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {groupedTasks.upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            Upcoming ({groupedTasks.upcoming.length})
          </h3>
          <div className="space-y-2">
            {groupedTasks.upcoming.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={onComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {showCompleted && groupedTasks.completed.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Completed ({groupedTasks.completed.length})
          </h3>
          <div className="space-y-2">
            {groupedTasks.completed.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={onComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
