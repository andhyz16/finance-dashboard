'use client';

import { MainLayout } from '@/components/layout';
import Dashboard from '@/components/features/Dashboard';

export default function Home() {
  return (
    <MainLayout>
      <Dashboard />
    </MainLayout>
  );
}

