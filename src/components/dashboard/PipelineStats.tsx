'use client';

import { Flame, Snowflake, TrendingUp, TrendingDown, Minus, Users, Target, Trophy, Percent } from 'lucide-react';
import { LEAD_STATUSES } from '@/lib/constants';
import type { PipelineStats } from '@/types';

interface PipelineStatsProps {
  stats: PipelineStats | null;
  isLoading?: boolean;
}

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

export function PipelineStatsDisplay({ stats, isLoading }: PipelineStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-16 mb-2" />
            <div className="h-8 bg-white/10 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Calculate performance levels
  const inProgress = stats.byStatus.contacted + stats.byStatus.called + stats.byStatus.proposal_sent + stats.byStatus.negotiating;
  const pipelineRatio = stats.total > 0 ? inProgress / stats.total : 0;

  // Performance logic
  const totalLeadsPerf: PerformanceLevel = stats.total >= 10 ? 'good' : stats.total > 0 ? 'neutral' : 'poor';
  const inProgressPerf: PerformanceLevel = pipelineRatio >= 0.3 ? 'good' : pipelineRatio > 0.1 ? 'neutral' : 'poor';
  const wonPerf: PerformanceLevel = stats.byStatus.won >= 3 ? 'good' : stats.byStatus.won > 0 ? 'neutral' : 'poor';
  const conversionPerf: PerformanceLevel = stats.conversionRate >= 20 ? 'good' : stats.conversionRate >= 10 ? 'neutral' : 'poor';

  return (
    <div className="space-y-4">
      {/* Main stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Leads */}
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-500">Total Leads</p>
            </div>
            {getPerformanceIcon(totalLeadsPerf)}
          </div>
          <p className="text-2xl font-medium text-gray-200">{stats.total}</p>
        </div>

        {/* In Progress */}
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
            {getPerformanceIcon(inProgressPerf)}
          </div>
          <p className="text-2xl font-medium text-gray-200">{inProgress}</p>
        </div>

        {/* Won */}
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-500">Won</p>
            </div>
            {getPerformanceIcon(wonPerf)}
          </div>
          <p className="text-2xl font-medium text-gray-200">{stats.byStatus.won}</p>
        </div>

        {/* Conversion */}
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-500">Conversion</p>
            </div>
            {getPerformanceIcon(conversionPerf)}
          </div>
          <p className="text-2xl font-medium text-gray-200">{stats.conversionRate}%</p>
        </div>
      </div>

      {/* Hot/Cold Leads */}
      <div className="grid grid-cols-2 gap-3">
        {/* Hot Leads */}
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="relative">
              <div className="absolute inset-0 blur-sm bg-orange-500/30 rounded-full" />
              <Flame className="relative w-4 h-4 text-orange-400" />
            </div>
            <p className="text-xs text-orange-400/80">Hot Leads</p>
          </div>
          <p className="text-2xl font-medium text-orange-300">{stats.hotLeads}</p>
        </div>

        {/* Cold Leads */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="relative">
              <div className="absolute inset-0 blur-sm bg-blue-500/20 rounded-full" />
              <Snowflake className="relative w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xs text-blue-400/80">Cold Leads</p>
          </div>
          <p className="text-2xl font-medium text-blue-300">{stats.coldLeads}</p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
        <p className="text-xs text-gray-500 mb-3">Pipeline Breakdown</p>
        <div className="flex flex-wrap gap-2">
          {LEAD_STATUSES.map((status) => {
            const count = stats.byStatus[status.id] || 0;
            if (count === 0) return null;
            return (
              <div
                key={status.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-xs text-gray-400"
              >
                <span className="font-medium text-gray-300">{count}</span>
                <span>{status.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
