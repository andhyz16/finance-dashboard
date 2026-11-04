'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Transaction,
  TransactionType,
  TransactionCategory,
} from '@/types';
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
  getTransactionsByMonth,
} from '@/lib/storage';
import {
  cn,
  formatCurrency,
  formatDate,
  formatMonth,
  getCurrentMonth,
  getCategoryLabel,
  getCategoryIcon,
  getCategoryColor,
} from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ─── Constants ──────────────────────────────────────────────────────────────

const INCOME_CATEGORIES: TransactionCategory[] = [
  'salary',
  'freelance',
  'investment_return',
  'gift',
  'other_income',
];

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

// ─── Demo Data Generator ────────────────────────────────────────────────────

function generateDemoTransactions(): void {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const demoData: Array<Omit<Transaction, 'id' | 'createdAt'>> = [
    // Income
    { type: 'income', category: 'salary', amount: 12000000, description: 'Gaji bulan ini', date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01` },
    { type: 'income', category: 'freelance', amount: 3500000, description: 'Proyek desain website', date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10` },
    { type: 'income', category: 'investment_return', amount: 750000, description: 'Dividen saham BBCA', date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15` },
    // Expenses
    { type: 'expense', category: 'food', amount: 1500000, description: 'Belanja bulanan supermarket', date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-02` },
    { type: 'expense', category: 'food', amount: 350000, description: 'Makan di luar', date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-08` },
    { type: 'expense', category: 'transport', amount: 500000, description: 'Bensin dan tol', date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-05` },
    { type: 'expense', category: 'utilities', amount: 850000, description: 'Listrik dan air', date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-03` },
    { type: 'expense', category: 'housing', amount: 3500000, description: 'Cicilan rumah', date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01` },
    { type: 'expense', category: 'entertainment', amount: 200000, description: 'Netflix dan Spotify', date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01` },
    { type: 'expense', category: 'health', amount: 450000, description: 'Obat dan vitamin', date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-12` },
    { type: 'expense', category: 'shopping', amount: 750000, description: 'Baju baru', date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-14` },
    { type: 'expense', category: 'education', amount: 500000, description: 'Kursus online', date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-07` },
    { type: 'expense', category: 'insurance', amount: 400000, description: 'Premi asuransi kesehatan', date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01` },
    // Last month data
    { type: 'income', category: 'salary', amount: 12000000, description: 'Gaji bulan lalu', date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01` },
    { type: 'income', category: 'freelance', amount: 2000000, description: 'Proyek logo', date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15` },
    { type: 'expense', category: 'food', amount: 1800000, description: 'Groceries', date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-05` },
    { type: 'expense', category: 'housing', amount: 3500000, description: 'Cicilan rumah', date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01` },
    { type: 'expense', category: 'transport', amount: 600000, description: 'Transportasi', date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-10` },
    { type: 'expense', category: 'utilities', amount: 900000, description: 'Tagihan utilitas', date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-03` },
  ];

  demoData.forEach((tx) => addTransaction(tx));
}

// ─── Modal Component ────────────────────────────────────────────────────────

function AddTransactionModal({
  isOpen,
  onClose,
  onAdd,
  defaultType,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  defaultType?: TransactionType;
}) {
  const [type, setType] = useState<TransactionType>(defaultType ?? 'expense');
  const [category, setCategory] = useState<TransactionCategory>('food');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    setDate(new Date().toISOString().split('T')[0]);
  }, [isOpen]);

  useEffect(() => {
    if (defaultType) setType(defaultType);
  }, [defaultType]);

  useEffect(() => {
    // Reset category when type changes
    setCategory(type === 'income' ? 'salary' : 'food');
  }, [type]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/\./g, ''));
    if (!numAmount || numAmount <= 0) return;

    addTransaction({
      type,
      category,
      amount: numAmount,
      description: description || getCategoryLabel(category),
      date,
    });

    // Reset
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    onAdd();
    onClose();
  };

  const handleAmountChange = (val: string) => {
    const clean = val.replace(/[^\d]/g, '');
    if (clean === '') {
      setAmount('');
      return;
    }
    const formatted = parseInt(clean, 10).toLocaleString('id-ID');
    setAmount(formatted);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md mx-4 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Tambah Transaksi</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Toggle */}
            <div className="flex gap-2 p-1 bg-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => setType('income')}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                💰 Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                  type === 'expense'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                💸 Pengeluaran
              </button>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as TransactionCategory)
                }
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryIcon(cat)} {getCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Jumlah (Rp)
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-600 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Deskripsi
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Masukkan deskripsi..."
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-600 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              className={cn(
                'w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-red-600 hover:bg-red-500'
              )}
            >
              Simpan Transaksi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation ────────────────────────────────────────────────────

function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  description,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  description: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center">
          <div className="text-4xl mb-3">🗑️</div>
          <h3 className="text-lg font-bold text-white mb-2">Hapus Transaksi?</h3>
          <p className="text-zinc-400 text-sm mb-6">
            &quot;{description}&quot; akan dihapus secara permanen.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-zinc-700 text-white font-medium hover:bg-zinc-600 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-500 transition-colors"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDefaultType, setAddDefaultType] = useState<TransactionType | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [mounted, setMounted] = useState(false);

  const loadTransactions = useCallback(() => {
    const all = getTransactions();
    // Initialize demo data if empty
    if (all.length === 0) {
      generateDemoTransactions();
    }
    const monthTx = getTransactionsByMonth(
      selectedMonth,
      filterType === 'all' ? undefined : filterType
    );
    // Sort by date descending
    monthTx.sort((a, b) => b.date.localeCompare(a.date));
    setTransactions(monthTx);
  }, [selectedMonth, filterType]);

  useEffect(() => {
    setMounted(true);
    loadTransactions();
  }, [loadTransactions]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        getCategoryLabel(t.category).toLowerCase().includes(q)
    );
  }, [transactions, searchQuery]);

  // Summary calculations
  const summary = useMemo(() => {
    const monthAll = getTransactionsByMonth(selectedMonth);
    const income = monthAll
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const expense = monthAll
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions, selectedMonth]);

  // Daily chart data
  const dailyChartData = useMemo(() => {
    const monthAll = getTransactionsByMonth(selectedMonth);
    const dailyMap: Record<string, { date: string; pemasukan: number; pengeluaran: number }> = {};

    monthAll.forEach((t) => {
      const day = t.date.split('-')[2];
      if (!dailyMap[day]) {
        dailyMap[day] = { date: day, pemasukan: 0, pengeluaran: 0 };
      }
      if (t.type === 'income') {
        dailyMap[day].pemasukan += t.amount;
      } else {
        dailyMap[day].pengeluaran += t.amount;
      }
    });

    return Object.values(dailyMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [transactions, selectedMonth]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteTransaction(deleteTarget.id);
    setDeleteTarget(null);
    loadTransactions();
  };

  const handleAddClick = (type?: TransactionType) => {
    setAddDefaultType(type);
    setShowAddModal(true);
  };

  // Generate month options (last 12 months)
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
          <h1 className="text-2xl font-bold text-white">Transaksi</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Kelola pemasukan dan pengeluaran Anda
          </p>
        </div>
        <button
          onClick={() => handleAddClick()}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          + Tambah Transaksi
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 cursor-pointer hover:border-emerald-500/50 transition-all duration-200"
          onClick={() => handleAddClick('income')}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-lg">
              📈
            </div>
            <span className="text-sm text-zinc-400">Total Pemasukan</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {formatCurrency(summary.income)}
          </p>
        </div>
        <div
          className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 cursor-pointer hover:border-red-500/50 transition-all duration-200"
          onClick={() => handleAddClick('expense')}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-lg">
              📉
            </div>
            <span className="text-sm text-zinc-400">Total Pengeluaran</span>
          </div>
          <p className="text-2xl font-bold text-red-400">
            {formatCurrency(summary.expense)}
          </p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-lg">
              💰
            </div>
            <span className="text-sm text-zinc-400">Saldo</span>
          </div>
          <p
            className={cn(
              'text-2xl font-bold',
              summary.balance >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {formatCurrency(summary.balance)}
          </p>
        </div>
      </div>

      {/* Daily Chart */}
      {dailyChartData.length > 0 && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">
            Pemasukan vs Pengeluaran Harian
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '12px',
                  fontSize: '13px',
                }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Legend />
              <Bar
                dataKey="pemasukan"
                name="Pemasukan"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="pengeluaran"
                name="Pengeluaran"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
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

        <div className="flex gap-2 p-1 bg-zinc-800 rounded-xl">
          {(['all', 'income', 'expense'] as const).map((ft) => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                filterType === ft
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              {ft === 'all'
                ? 'Semua'
                : ft === 'income'
                ? 'Pemasukan'
                : 'Pengeluaran'}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <span className="text-4xl mb-3">📭</span>
            <p className="font-medium">Belum ada transaksi</p>
            <p className="text-sm mt-1">
              Mulai catat pemasukan dan pengeluaran Anda
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {filteredTransactions.map((tx, idx) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 p-4 hover:bg-zinc-800/50 transition-colors duration-150 group"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {/* Category Icon */}
                <div
                  className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0',
                    getCategoryColor(tx.category),
                    'bg-opacity-20'
                  )}
                  style={{ backgroundColor: `${tx.type === 'income' ? '#10b98120' : '#ef444420'}` }}
                >
                  {getCategoryIcon(tx.category)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {tx.description}
                  </p>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    {getCategoryLabel(tx.category)} • {formatDate(tx.date)}
                  </p>
                </div>

                {/* Amount */}
                <p
                  className={cn(
                    'font-bold text-sm whitespace-nowrap',
                    tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                  )}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </p>

                {/* Delete */}
                <button
                  onClick={() => setDeleteTarget(tx)}
                  className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  title="Hapus"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction count */}
      <p className="text-center text-zinc-500 text-sm">
        {filteredTransactions.length} transaksi ditampilkan
      </p>

      {/* Modals */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={loadTransactions}
        defaultType={addDefaultType}
      />
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        description={deleteTarget?.description ?? ''}
      />
    </div>
  );
}
