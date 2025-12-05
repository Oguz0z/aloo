'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

interface OpportunitiesListProps {
  opportunities: string[];
  maxVisible?: number;
}

export function OpportunitiesList({ opportunities, maxVisible = 3 }: OpportunitiesListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!opportunities || opportunities.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">No opportunities identified</p>
    );
  }

  const visibleOpportunities = isExpanded
    ? opportunities
    : opportunities.slice(0, maxVisible);
  const hasMore = opportunities.length > maxVisible;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
        <Lightbulb className="w-3.5 h-3.5" />
        <span>Opportunities ({opportunities.length})</span>
      </div>
      <ul className="space-y-1.5">
        {visibleOpportunities.map((opportunity, index) => (
          <li
            key={index}
            className="flex items-start gap-2 text-sm text-gray-300"
          >
            <span className="text-green-500 mt-0.5">•</span>
            <span>{opportunity}</span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Show {opportunities.length - maxVisible} more
            </>
          )}
        </button>
      )}
    </div>
  );
}
