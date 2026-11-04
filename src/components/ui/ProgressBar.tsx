'use client';

import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const barColors = {
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
};

const barGlows = {
  emerald: 'shadow-emerald-500/30',
  blue: 'shadow-blue-500/30',
  amber: 'shadow-amber-500/30',
  red: 'shadow-red-500/30',
  purple: 'shadow-purple-500/30',
};

const barSizes = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'emerald',
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-xs font-medium text-slate-400">{label}</span>
          )}
          {showPercentage && (
            <span className="text-xs font-semibold text-slate-300">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`
          w-full rounded-full bg-slate-700/50 overflow-hidden ${barSizes[size]}
        `}
      >
        <div
          className={`
            ${barSizes[size]} rounded-full ${barColors[color]}
            shadow-sm ${barGlows[color]}
            transition-all duration-700 ease-out
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
