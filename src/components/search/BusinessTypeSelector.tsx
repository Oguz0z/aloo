'use client';

import {
  Utensils,
  Scissors,
  Dumbbell,
  Stethoscope,
  Store,
  Car,
  Home,
  Briefcase,
  Building,
} from 'lucide-react';
import { INDUSTRY_TYPES } from '@/lib/constants';
import type { IndustryType } from '@/types';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  utensils: Utensils,
  scissors: Scissors,
  dumbbell: Dumbbell,
  stethoscope: Stethoscope,
  store: Store,
  car: Car,
  home: Home,
  briefcase: Briefcase,
  building: Building,
};

interface BusinessTypeSelectorProps {
  selected: IndustryType | null;
  onSelect: (type: IndustryType) => void;
}

export function BusinessTypeSelector({ selected, onSelect }: BusinessTypeSelectorProps) {
  return (
    <div className="w-full max-w-2xl">
      <p className="text-sm text-gray-400 mb-3 text-center">Select business type</p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {INDUSTRY_TYPES.map((type) => {
          const Icon = ICONS[type.icon] || Building;
          const isSelected = selected === type.id;

          return (
            <button
              key={type.id}
              onClick={() => onSelect(type.id)}
              className={`
                flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all
                ${
                  isSelected
                    ? 'border-white bg-white/10 text-white'
                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium truncate w-full text-center">
                {type.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
