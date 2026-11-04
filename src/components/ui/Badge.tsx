'use client';

import React from 'react';

type BadgeColor = 'emerald' | 'red' | 'amber' | 'blue' | 'purple' | 'slate' | 'cyan' | 'pink';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const colorStyles: Record<BadgeColor, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  red: 'bg-red-500/15 text-red-400 border-red-500/20',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  slate: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  pink: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
};

const dotColorStyles: Record<BadgeColor, string> = {
  emerald: 'bg-emerald-400',
  red: 'bg-red-400',
  amber: 'bg-amber-400',
  blue: 'bg-blue-400',
  purple: 'bg-purple-400',
  slate: 'bg-slate-400',
  cyan: 'bg-cyan-400',
  pink: 'bg-pink-400',
};

export default function Badge({
  children,
  color = 'emerald',
  size = 'sm',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium border rounded-full
        ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
        ${colorStyles[color]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColorStyles[color]}`}
        />
      )}
      {children}
    </span>
  );
}
