'use client';

import { useEffect, useState } from 'react';

interface ProcessingLoaderProps {
  status: string;
  subtitle?: string;
  progress?: {
    current: number;
    total: number;
  };
}

export function ProcessingLoader({ status, subtitle, progress }: ProcessingLoaderProps) {
  const [dots, setDots] = useState('');

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const progressPercent = progress ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full bg-purple-500/10 blur-[100px]" />
        <div
          className="absolute bottom-1/4 right-1/4 h-80 w-80 animate-pulse rounded-full bg-blue-500/10 blur-[100px]"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 animate-pulse rounded-full bg-white/5 blur-[80px]"
          style={{ animationDelay: '0.5s' }}
        />
      </div>

      {/* Main loader container */}
      <div className="relative flex flex-col items-center">
        {/* Animated rings */}
        <div className="relative h-32 w-32 sm:h-40 sm:w-40">
          {/* Outer ring - slow rotation */}
          <div
            className="absolute inset-0 rounded-full border border-white/10"
            style={{
              animation: 'spin 8s linear infinite',
            }}
          >
            {/* Orbiting dot 1 */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
          </div>

          {/* Middle ring - medium rotation opposite direction */}
          <div
            className="absolute inset-4 rounded-full border border-white/20"
            style={{
              animation: 'spin 5s linear infinite reverse',
            }}
          >
            {/* Orbiting dot 2 */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
          </div>

          {/* Inner ring - fast rotation */}
          <div
            className="absolute inset-8 rounded-full border border-white/30"
            style={{
              animation: 'spin 3s linear infinite',
            }}
          >
            {/* Orbiting dot 3 */}
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
          </div>

          {/* Center pulsing core */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div
                className="absolute inset-0 animate-ping rounded-full bg-purple-500/30"
                style={{ animationDuration: '2s' }}
              />
              <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-[0_0_30px_rgba(168,85,247,0.5)]" />
            </div>
          </div>

          {/* Scanning line effect */}
          <div
            className="absolute inset-0 overflow-hidden rounded-full"
            style={{
              animation: 'spin 2s linear infinite',
            }}
          >
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
          </div>
        </div>

        {/* Status text */}
        <div className="mt-8 sm:mt-10 text-center">
          <p className="text-base sm:text-lg font-medium text-white">
            {status}
            <span className="inline-block w-6 text-left">{dots}</span>
          </p>
          {subtitle && <p className="mt-2 text-sm text-white/50">{subtitle}</p>}

          {/* Enhanced progress bar */}
          {progress && (
            <div className="mt-6 flex flex-col items-center gap-3">
              {/* Progress bar container */}
              <div className="relative w-64 sm:w-80">
                {/* Background track */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08] backdrop-blur-sm">
                  {/* Animated gradient fill */}
                  <div
                    className="relative h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${progressPercent}%`,
                      background:
                        'linear-gradient(90deg, rgba(168,85,247,0.9) 0%, rgba(59,130,246,0.9) 50%, rgba(168,85,247,0.9) 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s linear infinite',
                    }}
                  >
                    {/* Inner glow */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent" />
                  </div>
                </div>

                {/* Glowing dot at progress end */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
                  style={{
                    left: `calc(${progressPercent}% - 6px)`,
                    opacity: progressPercent > 0 ? 1 : 0,
                  }}
                >
                  <div className="relative">
                    {/* Outer glow */}
                    <div
                      className="absolute -inset-2 rounded-full bg-purple-500/50 blur-md"
                      style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
                    />
                    {/* Core dot */}
                    <div className="relative h-3 w-3 rounded-full bg-white shadow-[0_0_12px_rgba(168,85,247,1),0_0_24px_rgba(59,130,246,0.8)]" />
                  </div>
                </div>
              </div>

              {/* Progress text */}
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-xs font-mono tabular-nums text-white/60">
                  {Math.round(progressPercent)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { top: '25%', left: '30%' },
            { top: '40%', left: '70%' },
            { top: '60%', left: '25%' },
            { top: '35%', left: '55%' },
            { top: '70%', left: '65%' },
            { top: '50%', left: '40%' },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white/30"
              style={{
                top: pos.top,
                left: pos.left,
                animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom hint */}
      <p className="absolute bottom-8 text-xs text-white/30">
        This may take a while for longer transcripts
      </p>

      {/* Custom keyframes */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) scale(1.5);
            opacity: 0.6;
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}
