'use client';

import { useState } from 'react';
import { Flame, Snowflake, Sparkles } from 'lucide-react';
import type { ScoreBreakdown, WebsiteAnalysis } from '@/types';

interface LeadScoreBadgeProps {
  score: number;
  breakdown?: ScoreBreakdown;
  websiteAnalysis?: WebsiteAnalysis;
}

// Hot Lead Icon - flame with glow
function HotLeadIcon() {
  return (
    <div className="relative">
      <div className="absolute inset-0 blur-sm bg-orange-500/30 rounded-full" />
      <Flame className="relative w-4 h-4 text-orange-400" />
    </div>
  );
}

// Cold Lead Icon - snowflake with subtle blue
function ColdLeadIcon() {
  return (
    <div className="relative">
      <div className="absolute inset-0 blur-sm bg-blue-500/20 rounded-full" />
      <Snowflake className="relative w-4 h-4 text-blue-400" />
    </div>
  );
}

// Neutral Lead Icon - sparkles with amber glow
function NeutralLeadIcon() {
  return (
    <div className="relative">
      <div className="absolute inset-0 blur-sm bg-amber-500/20 rounded-full" />
      <Sparkles className="relative w-4 h-4 text-amber-400" />
    </div>
  );
}

export function LeadScoreBadge({
  score,
  breakdown,
  websiteAnalysis,
}: LeadScoreBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Score styling with color accents
  const getScoreStyle = (s: number) => {
    if (s >= 55) {
      return {
        text: 'text-orange-300',
        border: 'border-orange-500/30',
        bg: 'bg-orange-500/10',
        glow: 'shadow-[0_0_10px_rgba(249,115,22,0.15)]',
      };
    }
    if (s >= 35) {
      return {
        text: 'text-gray-300',
        border: 'border-white/10',
        bg: 'bg-white/5',
        glow: '',
      };
    }
    return {
      text: 'text-blue-300',
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/5',
      glow: '',
    };
  };

  const style = getScoreStyle(score);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {/* Hot/Neutral/Cold Icon */}
        {score >= 55 && <HotLeadIcon />}
        {score >= 35 && score < 55 && <NeutralLeadIcon />}
        {score < 35 && <ColdLeadIcon />}

        <button
          onClick={() => breakdown && setIsExpanded(!isExpanded)}
          className={`flex items-center justify-center w-10 h-10 rounded-lg font-mono text-lg transition-all hover:bg-white/10 ${style.text} ${style.border} ${style.bg} ${style.glow}`}
          title={breakdown ? 'Click for details' : undefined}
        >
          {score}
        </button>
      </div>

      {isExpanded && breakdown && (
        <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-lg text-xs w-full min-w-[280px]">
          <div className="font-medium mb-2 text-gray-300">Score Breakdown</div>

          {/* Layer 1: Basic Presence */}
          <div className="mb-2">
            <div className="text-gray-500 text-[10px] uppercase tracking-wide mb-1">
              Basic Presence
            </div>
            <div className="space-y-0.5">
              <ScoreRow label="No website" value={breakdown.noWebsite} />
              <ScoreRow label="Social-only site" value={breakdown.socialOnlyWebsite} />
              <ScoreRow label="No phone" value={breakdown.noPhone} />
            </div>
          </div>

          {/* Layer 2: Google Profile */}
          <div className="mb-2">
            <div className="text-gray-500 text-[10px] uppercase tracking-wide mb-1">
              Google Profile
            </div>
            <div className="space-y-0.5">
              <ScoreRow label="Few photos" value={breakdown.fewPhotos} />
              <ScoreRow label="Low reviews" value={breakdown.lowReviews} />
              <ScoreRow label="Hidden gem" value={breakdown.hiddenGem} />
            </div>
          </div>

          {/* Layer 3: Website Technical */}
          <div className="mb-2">
            <div className="text-gray-500 text-[10px] uppercase tracking-wide mb-1">
              Website Technical
            </div>
            <div className="space-y-0.5">
              <ScoreRow label="Poor performance" value={breakdown.poorPerformance} />
              <ScoreRow label="Not mobile-friendly" value={breakdown.notMobileFriendly} />
              <ScoreRow label="No HTTPS" value={breakdown.noHttps} />
            </div>
          </div>

          {/* Layer 4: Website Opportunities */}
          <div className="mb-2">
            <div className="text-gray-500 text-[10px] uppercase tracking-wide mb-1">
              Website Opportunities
            </div>
            <div className="space-y-0.5">
              <ScoreRow label="Outdated website" value={breakdown.outdatedWebsite} />
              <ScoreRow label="No online booking" value={breakdown.noOnlineBooking} />
              <ScoreRow label="No social links" value={breakdown.noSocialLinks} />
              <ScoreRow label="Basic tech stack" value={breakdown.basicTechStack} />
            </div>
          </div>

          {/* Website Analysis Details */}
          {websiteAnalysis && !websiteAnalysis.hasErrors && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="text-gray-500 text-[10px] uppercase tracking-wide mb-1">
                PageSpeed Analysis
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-400">
                <div>
                  Performance: <span className="text-gray-300">{websiteAnalysis.performanceScore}/100</span>
                </div>
                <div>
                  Mobile: <span className="text-gray-300">{websiteAnalysis.isMobileFriendly ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  HTTPS: <span className="text-gray-300">{websiteAnalysis.isHttps ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  Response: <span className="text-gray-300">{Math.round(websiteAnalysis.responseTime)}ms</span>
                </div>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="mt-2 pt-2 border-t border-white/10 flex justify-between font-medium">
            <span className="text-gray-400">Total Score</span>
            <span className="text-white">{breakdown.total}/100</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  if (value === 0) return null;
  return (
    <div className="flex justify-between text-gray-500">
      <span>{label}</span>
      <span className="text-gray-300">+{value}</span>
    </div>
  );
}
