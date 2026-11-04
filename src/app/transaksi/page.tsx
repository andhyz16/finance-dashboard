'use client';

import { MainLayout } from '@/components/layout';
import TransactionList from '@/components/features/TransactionList';

export default function TransaksiPage() {
  return (
    <MainLayout>
      <TransactionList />
    </MainLayout>
  );
}

