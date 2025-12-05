'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry = useMemo(
    () => COUNTRIES.find((c) => c.code === country),
    [country]
  );

  const placeholder = useMemo(() => {
    if (selectedCountry?.examples?.[0]) {
      return `e.g. ${selectedCountry.examples[0]}`;
    }
    return 'Enter city...';
  }, [selectedCountry]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && city.trim()) {
      onSearch();
    }
  };

  const handleCountrySelect = (code: string) => {
    onCountryChange(code);
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full max-w-md">
      <p className="text-sm text-gray-400 mb-3 text-center">Select country and city</p>
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
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
        />

        {/* Custom Country Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 px-2 py-1 rounded border border-gray-600 bg-gray-800 hover:bg-gray-700 hover:border-gray-500 transition-all text-xs text-white"
          >
            <span className="font-medium">{country.toUpperCase()}</span>
            <ChevronDown
              className={`w-3 h-3 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 max-h-64 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-xl z-50">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountrySelect(c.code)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors
                    ${country === c.code ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-gray-500 w-6">{c.code.toUpperCase()}</span>
                    <span>{c.name}</span>
                  </span>
                  {country === c.code && <Check className="w-4 h-4 text-green-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
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
