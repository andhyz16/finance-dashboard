'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  onMenuToggle: () => void;
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/transaksi': 'Transaksi',
  '/anggaran': 'Anggaran',
  '/tabungan': 'Target Tabungan',
  '/portfolio': 'Portfolio',
  '/kekayaan': 'Kekayaan Bersih',
};

export default function Header({
  onMenuToggle,
  currentMonth,
  onPrevMonth,
  onNextMonth,
}: HeaderProps) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] || 'Dashboard';

  const monthLabel = currentMonth.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-4 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
      {/* Left: Hamburger + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors lg:hidden"
          aria-label="Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-slate-100">
          {pageTitle}
        </h1>
      </div>

      {/* Right: Month Navigator */}
      <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl border border-slate-700/50 px-1 py-1">
        <button
          onClick={onPrevMonth}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
          aria-label="Bulan sebelumnya"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="px-3 py-1 text-sm font-medium text-slate-200 min-w-[140px] text-center">
          {monthLabel}
        </span>
        <button
          onClick={onNextMonth}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
          aria-label="Bulan berikutnya"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </header>
  );
}
