'use client';

import { TrendingUp, TrendingDown, Minus, Users, Target, Trophy, Percent } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ReactNode } from 'react';

type PerformanceLevel = 'good' | 'neutral' | 'poor';

function getPerformanceIcon(level: PerformanceLevel) {
  switch (level) {
    case 'good':
      return (
        <div className="relative">
          <div className="absolute inset-0 blur-sm bg-emerald-500/30 rounded-full" />
          <TrendingUp className="relative w-4 h-4 text-emerald-400" />
        </div>
      );
    case 'poor':
      return (
        <div className="relative">
          <div className="absolute inset-0 blur-sm bg-red-500/30 rounded-full" />
          <TrendingDown className="relative w-4 h-4 text-red-400" />
        </div>
      );
    default:
      return (
        <div className="relative">
          <div className="absolute inset-0 blur-sm bg-amber-500/20 rounded-full" />
          <Minus className="relative w-4 h-4 text-amber-400" />
        </div>
      );
  }
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  performanceLevel: PerformanceLevel;
  isLoading?: boolean;
}

function MetricCard({ label, value, icon, performanceLevel, isLoading }: MetricCardProps) {
  return (
    <div className="bg-card border border-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-xs text-gray-500">{label}</p>
        </div>
        {!isLoading && getPerformanceIcon(performanceLevel)}
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-16 mt-1" />
      ) : (
        <p className="text-2xl font-medium text-gray-200">{value}</p>
      )}
    </div>
  );
}

interface MetricsRowProps {
  total: number;
  inProgress: number;
  won: number;
  conversionRate: number;
  isLoading?: boolean;
}

export function MetricsRow({
  total,
  inProgress,
  won,
  conversionRate,
  isLoading,
}: MetricsRowProps) {
  // Calculate performance levels
  const pipelineRatio = total > 0 ? inProgress / total : 0;

  const totalLeadsPerf: PerformanceLevel = total >= 10 ? 'good' : total > 0 ? 'neutral' : 'poor';
  const inProgressPerf: PerformanceLevel = pipelineRatio >= 0.3 ? 'good' : pipelineRatio > 0.1 ? 'neutral' : 'poor';
  const wonPerf: PerformanceLevel = won >= 3 ? 'good' : won > 0 ? 'neutral' : 'poor';
  const conversionPerf: PerformanceLevel = conversionRate >= 20 ? 'good' : conversionRate >= 10 ? 'neutral' : 'poor';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <MetricCard
        label="Total Leads"
        value={total}
        icon={<Users className="w-4 h-4 text-gray-500" />}
        performanceLevel={totalLeadsPerf}
        isLoading={isLoading}
      />
      <MetricCard
        label="In Progress"
        value={inProgress}
        icon={<Target className="w-4 h-4 text-gray-500" />}
        performanceLevel={inProgressPerf}
        isLoading={isLoading}
      />
      <MetricCard
        label="Won"
        value={won}
        icon={<Trophy className="w-4 h-4 text-gray-500" />}
        performanceLevel={wonPerf}
        isLoading={isLoading}
      />
      <MetricCard
        label="Conversion"
        value={`${conversionRate}%`}
        icon={<Percent className="w-4 h-4 text-gray-500" />}
        performanceLevel={conversionPerf}
        isLoading={isLoading}
      />
    </div>
  );
}
