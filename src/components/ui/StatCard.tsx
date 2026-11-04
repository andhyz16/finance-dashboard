'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  change?: number; // percentage change, positive = up, negative = down
  icon?: string;
  className?: string;
  accentColor?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'cyan';
}

const gradientStyles = {
  emerald: 'from-emerald-500/10 to-transparent border-emerald-500/20',
  blue: 'from-blue-500/10 to-transparent border-blue-500/20',
  amber: 'from-amber-500/10 to-transparent border-amber-500/20',
  red: 'from-red-500/10 to-transparent border-red-500/20',
  purple: 'from-purple-500/10 to-transparent border-purple-500/20',
  cyan: 'from-cyan-500/10 to-transparent border-cyan-500/20',
};

const iconBgStyles = {
  emerald: 'bg-emerald-500/15 text-emerald-400',
  blue: 'bg-blue-500/15 text-blue-400',
  amber: 'bg-amber-500/15 text-amber-400',
  red: 'bg-red-500/15 text-red-400',
  purple: 'bg-purple-500/15 text-purple-400',
  cyan: 'bg-cyan-500/15 text-cyan-400',
};

export default function StatCard({
  label,
  value,
  change,
  icon,
  className = '',
  accentColor = 'emerald',
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border border-slate-700/50
        bg-gradient-to-br ${gradientStyles[accentColor]}
        bg-slate-800/60 backdrop-blur-xl
        p-5 transition-all duration-300
        hover:border-slate-600/60 hover:shadow-lg hover:shadow-black/20
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-100">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              <span
                className={`
                  inline-flex items-center gap-0.5 text-xs font-semibold
                  ${isPositive ? 'text-emerald-400' : 'text-red-400'}
                `}
              >
                {isPositive ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                  </svg>
                )}
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500">dari bulan lalu</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={`
              flex items-center justify-center w-11 h-11 rounded-xl
              ${iconBgStyles[accentColor]}
              text-xl
            `}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
