'use client';

import { useEffect, useState, useCallback } from 'react';

interface PreLoaderProps {
  onComplete?: () => void;
  duration?: number;
}

const TEXT = 'ALOO';
const SLOGAN = 'A Lot Of Opportunities';

export function PreLoader({ onComplete, duration = 2500 }: PreLoaderProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [animatedIndex, setAnimatedIndex] = useState(-2);
  const [showSlogan, setShowSlogan] = useState(false);

  const getScale = useCallback(
    (index: number) => {
      if (animatedIndex < 0) return 1;
      const distance = Math.abs(index - animatedIndex);
      return Math.max(1, 1.4 - distance * 0.15);
    },
    [animatedIndex]
  );

  const getTranslateY = useCallback(
    (index: number) => {
      if (animatedIndex < 0) return 0;
      const distance = Math.abs(index - animatedIndex);
      return Math.min(0, -8 + distance * 3);
    },
    [animatedIndex]
  );

  useEffect(() => {
    // Start animation after a brief delay
    const startDelay = setTimeout(() => {
      setAnimatedIndex(0);
    }, 300);

    return () => clearTimeout(startDelay);
  }, []);

  useEffect(() => {
    if (animatedIndex < 0) return;

    // Animate through each character
    if (animatedIndex < TEXT.length + 2) {
      const timer = setTimeout(() => {
        setAnimatedIndex((prev) => prev + 1);
      }, 80);
      return () => clearTimeout(timer);
    } else {
      // Show slogan after ALOO animation completes
      const sloganTimer = setTimeout(() => {
        setShowSlogan(true);
      }, 100);
      return () => clearTimeout(sloganTimer);
    }
  }, [animatedIndex]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <h1 className="flex text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white font-orbitron tracking-wider">
        {TEXT.split('').map((char, index) => (
          <span
            key={index}
            className="inline-block transition-transform duration-150 ease-out"
            style={{
              transform: `scale(${getScale(index)}) translateY(${getTranslateY(index)}px)`,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </h1>
      <p
        className={`mt-3 text-sm sm:text-base md:text-lg font-orbitron tracking-widest text-white/60 transition-opacity duration-500 ${
          showSlogan ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {SLOGAN}
      </p>
    </div>
  );
}
