'use client';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getCurrentMonth } from '@/lib/utils';

interface AppContextType {
  currentMonth: string; // YYYY-MM
  setCurrentMonth: (month: string) => void;
  navigateMonth: (direction: 'prev' | 'next') => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Initialize with empty string to avoid calling new Date() during SSR prerender
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Set the actual current month only on the client side
  useEffect(() => {
    setCurrentMonth(getCurrentMonth());
  }, []);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      if (!prev) return getCurrentMonth();
      const [year, month] = prev.split('-').map(Number);
      const date = new Date(year, month - 1);
      if (direction === 'prev') date.setMonth(date.getMonth() - 1);
      else date.setMonth(date.getMonth() + 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <AppContext.Provider value={{ currentMonth, setCurrentMonth, navigateMonth, refreshKey, triggerRefresh }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
