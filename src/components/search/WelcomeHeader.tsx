'use client';

import { useState } from 'react';

const TEXT = 'ALOO';
const SLOGAN = 'A Lot Of Opportunities';

export function WelcomeHeader() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getScale = (index: number) => {
    if (hoveredIndex === null) return 1;
    const distance = Math.abs(index - hoveredIndex);
    // Max scale 1.4, decreasing by 0.15 per letter distance
    return Math.max(1, 1.4 - distance * 0.15);
  };

  const getTranslateY = (index: number) => {
    if (hoveredIndex === null) return 0;
    const distance = Math.abs(index - hoveredIndex);
    // Move up when scaled, max -8px at hovered letter
    return Math.min(0, -8 + distance * 3);
  };

  return (
    <div className="flex flex-col items-center gap-1 text-center px-4">
      <h1
        className="flex text-3xl sm:text-4xl md:text-5xl font-bold text-white font-orbitron tracking-wider"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {TEXT.split('').map((char, index) => (
          <span
            key={index}
            className="inline-block transition-transform duration-150 ease-out cursor-default"
            style={{
              transform: `scale(${getScale(index)}) translateY(${getTranslateY(index)}px)`,
            }}
            onMouseEnter={() => setHoveredIndex(index)}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </h1>
      <p className="text-xs sm:text-sm font-orbitron tracking-widest text-white/50">
        {SLOGAN}
      </p>
    </div>
  );
}
