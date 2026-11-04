'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TransactionCategory,
  MonthlyBudget,
  BudgetCategory,
} from '@/types';
import {
  getBudget,
  saveBudget,
  setBudgetCategory,
  getTransactionsByMonth,
} from '@/lib/storage';
import {
  cn,
  formatCurrency,
  formatMonth,
  getCurrentMonth,
  getCategoryLabel,
  getCategoryIcon,
  calculatePercentage,
} from '@/lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

// ─── Constants ──────────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'food',
  'transport',
  'housing',
  'utilities',
  'entertainment',
  'health',
  'education',
  'shopping',
  'insurance',
  'debt_payment',
  'other_expense',
];

const PIE_COLORS = [
  '#10b981', '#06b6d4', '#8b5cf6', '#f59e0b',
  '#ef4444', '#ec4899', '#3b82f6', '#14b8a6',
  '#f97316', '#6366f1', '#84cc16',
];

// ─── Demo Data ──────────────────────────────────────────────────────────────

function generateDemoBudget(month: string): void {
  const defaults: Array<{ category: TransactionCategory; limit: number }> = [
    { category: 'food', limit: 2500000 },
    { category: 'transport', limit: 1000000 },
    { category: 'housing', limit: 4000000 },
    { category: 'utilities', limit: 1000000 },
    { category: 'entertainment', limit: 500000 },
    { category: 'health', limit: 600000 },
    { category: 'education', limit: 750000 },
    { category: 'shopping', limit: 1000000 },
    { category: 'insurance', limit: 500000 },
    { category: 'debt_payment', limit: 500000 },
    { category: 'other_expense', limit: 500000 },
  ];

  defaults.forEach(({ category, limit }) => {
    setBudgetCategory(month, category, limit);
  });
}

// ─── Edit Budget Modal ──────────────────────────────────────────────────────

function EditBudgetModal({
  isOpen,
  onClose,
  onSave,
  category,
  currentLimit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: TransactionCategory, limit: number) => void;
  category: TransactionCategory | null;
  currentLimit: number;
}) {
  const [limit, setLimit] = useState('');

  useEffect(() => {
    if (currentLimit > 0) {
      setLimit(currentLimit.toLocaleString('id-ID'));
    } else {
      setLimit('');
    }
  }, [currentLimit, isOpen]);

  const handleAmountChange = (val: string) => {
    const clean = val.replace(/[^\d]/g, '');
    if (clean === '') {
      setLimit('');
      return;
    }
    setLimit(parseInt(clean, 10).toLocaleString('id-ID'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;
    const numLimit = parseFloat(limit.replace(/\./g, ''));
    if (!numLimit || numLimit <= 0) return;
    onSave(category, numLimit);
    onClose();
  };

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-lg font-bold text-white mb-4">
          {getCategoryIcon(category)} Atur Anggaran {getCategoryLabel(category)}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Batas Anggaran (Rp)
            </label>
            <input
              type="text"
              value={limit}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-600 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              autoFocus
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-zinc-700 text-white font-medium hover:bg-zinc-600 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Category Budget Modal ──────────────────────────────────────────────

function AddBudgetModal({
  isOpen,
  onClose,
  onSave,
  existingCategories,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: TransactionCategory, limit: number) => void;
  existingCategories: TransactionCategory[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | ''>('');
  const [limit, setLimit] = useState('');

  const availableCategories = EXPENSE_CATEGORIES.filter(
    (c) => !existingCategories.includes(c)
  );

  useEffect(() => {
    if (availableCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(availableCategories[0]);
    }
  }, [availableCategories, selectedCategory]);

  const handleAmountChange = (val: string) => {
    const clean = val.replace(/[^\d]/g, '');
    if (clean === '') {
      setLimit('');
      return;
    }
    setLimit(parseInt(clean, 10).toLocaleString('id-ID'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    const numLimit = parseFloat(limit.replace(/\./g, ''));
    if (!numLimit || numLimit <= 0) return;
    onSave(selectedCategory as TransactionCategory, numLimit);
    setLimit('');
    setSelectedCategory('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-lg font-bold text-white mb-4">Tambah Anggaran Kategori</h2>
        {availableCategories.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-zinc-400">Semua kategori sudah memiliki anggaran.</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 rounded-xl bg-zinc-700 text-white hover:bg-zinc-600 transition-colors"
            >
              Tutup
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Kategori</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as TransactionCategory)}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryIcon(cat)} {getCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Batas Anggaran (Rp)
              </label>
              <input
                type="text"
                value={limit}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-600 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-zinc-700 text-white font-medium hover:bg-zinc-600 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors"
              >
                Simpan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Progress Bar Component ─────────────────────────────────────────────────

function BudgetProgressBar({
  category,
  spent,
  limit,
  onEdit,
}: {
  category: TransactionCategory;
  spent: number;
  limit: number;
  onEdit: () => void;
}) {
  const percentage = calculatePercentage(spent, limit);
  const isOverBudget = spent > limit;

  const getBarColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getTextColor = () => {
    if (isOverBudget) return 'text-red-400';
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 70) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  return (
    <div className="group bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 hover:border-zinc-600 transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getCategoryIcon(category)}</span>
          <span className="text-white font-medium text-sm">
            {getCategoryLabel(category)}
          </span>
        </div>
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
          title="Edit anggaran"
        >
          ✏️
        </button>
      </div>

      <div className="w-full h-2.5 bg-zinc-700 rounded-full overflow-hidden mb-2">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            getBarColor()
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={getTextColor()}>
          {formatCurrency(spent)} / {formatCurrency(limit)}
        </span>
        <span className={cn('font-semibold', getTextColor())}>
          {percentage}%
        </span>
      </div>

      {/* Warning alerts */}
      {isOverBudget && (
        <div className="mt-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-xs font-medium">
            ⚠️ Melebihi anggaran sebesar {formatCurrency(spent - limit)}!
          </p>
        </div>
      )}
      {!isOverBudget && percentage >= 90 && (
        <div className="mt-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400 text-xs font-medium">
            ⚠️ Hampir mencapai batas anggaran!
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function BudgetManager() {
  const [budget, setBudgetState] = useState<MonthlyBudget | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [editTarget, setEditTarget] = useState<{
    category: TransactionCategory;
    limit: number;
  } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const loadBudget = useCallback(() => {
    let b = getBudget(selectedMonth);
    if (!b) {
      generateDemoBudget(selectedMonth);
      b = getBudget(selectedMonth);
    }
    setBudgetState(b);
  }, [selectedMonth]);

  useEffect(() => {
    setMounted(true);
    loadBudget();
  }, [loadBudget]);

  const handleSaveBudget = (category: TransactionCategory, limit: number) => {
    setBudgetCategory(selectedMonth, category, limit);
    loadBudget();
  };

  // Summary stats
  const stats = useMemo(() => {
    if (!budget) return { totalBudget: 0, totalSpent: 0, remaining: 0, overBudgetCount: 0, warningCount: 0 };
    const totalBudget = budget.categories.reduce((s, c) => s + c.limit, 0);
    const totalSpent = budget.categories.reduce((s, c) => s + c.spent, 0);
    const overBudgetCount = budget.categories.filter((c) => c.spent > c.limit).length;
    const warningCount = budget.categories.filter((c) => {
      const pct = calculatePercentage(c.spent, c.limit);
      return pct >= 70 && c.spent <= c.limit;
    }).length;
    return {
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
      overBudgetCount,
      warningCount,
    };
  }, [budget]);

  // Pie chart data
  const pieData = useMemo(() => {
    if (!budget) return [];
    return budget.categories
      .filter((c) => c.limit > 0)
      .map((c) => ({
        name: getCategoryLabel(c.category),
        value: c.limit,
      }));
  }, [budget]);

  const [monthOptions, setMonthOptions] = useState<string[]>([]);

  useEffect(() => {
    const options: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      options.push(m);
    }
    setMonthOptions(options);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Anggaran</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Kelola anggaran bulanan per kategori
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            + Tambah Anggaran
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-lg">📋</div>
            <span className="text-sm text-zinc-400">Total Anggaran</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalBudget)}</p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-lg">💸</div>
            <span className="text-sm text-zinc-400">Total Terpakai</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(stats.totalSpent)}</p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-lg">💰</div>
            <span className="text-sm text-zinc-400">Sisa Anggaran</span>
          </div>
          <p className={cn('text-2xl font-bold', stats.remaining >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {formatCurrency(stats.remaining)}
          </p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-lg">⚠️</div>
            <span className="text-sm text-zinc-400">Peringatan</span>
          </div>
          <p className="text-2xl font-bold text-white">
            <span className="text-red-400">{stats.overBudgetCount}</span>
            {' / '}
            <span className="text-yellow-400">{stats.warningCount}</span>
          </p>
          <p className="text-xs text-zinc-500 mt-1">Melebihi / Hampir limit</p>
        </div>
      </div>

      {/* Total Budget Progress */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Pemakaian Total</h3>
          <span className={cn(
            'text-sm font-bold',
            calculatePercentage(stats.totalSpent, stats.totalBudget) > 90
              ? 'text-red-400'
              : calculatePercentage(stats.totalSpent, stats.totalBudget) > 70
              ? 'text-yellow-400'
              : 'text-emerald-400'
          )}>
            {calculatePercentage(stats.totalSpent, stats.totalBudget)}%
          </span>
        </div>
        <div className="w-full h-4 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-1000 ease-out',
              calculatePercentage(stats.totalSpent, stats.totalBudget) > 90
                ? 'bg-red-500'
                : calculatePercentage(stats.totalSpent, stats.totalBudget) > 70
                ? 'bg-yellow-500'
                : 'bg-emerald-500'
            )}
            style={{ width: `${Math.min(calculatePercentage(stats.totalSpent, stats.totalBudget), 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-zinc-500">
          <span>Terpakai: {formatCurrency(stats.totalSpent)}</span>
          <span>Anggaran: {formatCurrency(stats.totalBudget)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Categories Grid */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-lg font-semibold text-white">Anggaran per Kategori</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {budget?.categories.map((bc) => (
              <BudgetProgressBar
                key={bc.category}
                category={bc.category}
                spent={bc.spent}
                limit={bc.limit}
                onEdit={() =>
                  setEditTarget({ category: bc.category, limit: bc.limit })
                }
              />
            ))}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Alokasi Anggaran</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '12px',
                    fontSize: '13px',
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value) => (
                    <span className="text-zinc-300">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-zinc-500">
              <p>Belum ada data anggaran</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditBudgetModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveBudget}
        category={editTarget?.category ?? null}
        currentLimit={editTarget?.limit ?? 0}
      />
      <AddBudgetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveBudget}
        existingCategories={budget?.categories.map((c) => c.category) ?? []}
      />
    </div>
  );
}
