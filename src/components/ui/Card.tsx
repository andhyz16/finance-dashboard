'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: string;
  action?: React.ReactNode;
}

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  icon,
  action,
}: CardProps) {
  return (
    <div
      className={`
        relative rounded-2xl border border-slate-700/50
        bg-slate-800/60 backdrop-blur-xl
        shadow-lg shadow-black/10
        transition-all duration-300
        hover:border-slate-600/60 hover:shadow-xl hover:shadow-black/20
        ${className}
      `}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-5 pb-1">
          <div className="flex items-center gap-3">
            {icon && <span className="text-xl">{icon}</span>}
            <div>
              {title && (
                <h3 className="text-base font-semibold text-slate-100">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
