'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { COUNTRIES } from '@/lib/constants';

interface CityInputProps {
  city: string;
  country: string;
  onCityChange: (city: string) => void;
  onCountryChange: (country: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export function CityInput({
  city,
  country,
  onCityChange,
  onCountryChange,
  onSearch,
  isLoading,
}: CityInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && city.trim()) {
      onSearch();
    }
  };

  return (
    <div className="w-full max-w-md">
      <p className="text-sm text-gray-400 mb-3 text-center">Enter city to search</p>
      <div
        className={`
          flex items-center gap-2 p-3 rounded-lg border transition-all
          ${isFocused ? 'border-white bg-gray-800' : 'border-gray-700 bg-gray-800/50'}
        `}
      >
        <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="e.g. Sydney, Melbourne, Brisbane..."
          className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
        />
        <select
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          className="bg-gray-700 text-white text-xs rounded px-2 py-1 outline-none cursor-pointer"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={onSearch}
        disabled={!city.trim() || isLoading}
        className={`
          w-full mt-3 py-2.5 rounded-lg font-medium text-sm transition-all
          ${
            city.trim() && !isLoading
              ? 'bg-white text-black hover:bg-gray-200'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isLoading ? 'Searching...' : 'Search Businesses'}
      </button>
    </div>
  );
}
