'use client';

import type { TaskPriority } from '@/types';

const priorityStyles: Record<TaskPriority, string> = {
  low: 'text-gray-500',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  urgent: 'text-red-400',
};

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  showLabel?: boolean;
}

export function TaskPriorityBadge({ priority, showLabel = true }: TaskPriorityBadgeProps) {
  return (
    <span className={`text-xs font-medium ${priorityStyles[priority]}`}>
      {showLabel ? priorityLabels[priority] : '●'}
    </span>
  );
}
