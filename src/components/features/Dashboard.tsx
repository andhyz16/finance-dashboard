'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getFinancialSummary, getTransactions, getSavingsGoals, getPortfolio, addTransaction } from '@/lib/storage';
import { formatCurrency, formatDate, getCategoryIcon, getCategoryLabel, getCurrentMonth, formatMonth } from '@/lib/utils';
import { FinancialSummary, SavingsGoal, Transaction } from '@/types';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

// ─── Seed Demo Data ─────────────────────────────────────────────────────────
function seedDemoData() {
  const existing = localStorage.getItem('fin_transactions');
  if (existing && JSON.parse(existing).length > 0) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const pad = (n: number) => String(n).padStart(2, '0');

  const demoTx = [
    { type: 'income' as const, category: 'salary' as const, amount: 8000000, description: 'Gaji Bulanan', date: `${year}-${month}-01` },
    { type: 'income' as const, category: 'freelance' as const, amount: 1500000, description: 'Proyek Desain', date: `${year}-${month}-05` },
    { type: 'expense' as const, category: 'housing' as const, amount: 2000000, description: 'Sewa Kos', date: `${year}-${month}-01` },
    { type: 'expense' as const, category: 'food' as const, amount: 800000, description: 'Belanja Groceries', date: `${year}-${month}-03` },
    { type: 'expense' as const, category: 'transport' as const, amount: 300000, description: 'Bensin & Parkir', date: `${year}-${month}-07` },
    { type: 'expense' as const, category: 'entertainment' as const, amount: 200000, description: 'Netflix & Spotify', date: `${year}-${month}-10` },
    { type: 'expense' as const, category: 'health' as const, amount: 150000, description: 'Vitamin & Obat', date: `${year}-${month}-12` },
    { type: 'expense' as const, category: 'shopping' as const, amount: 500000, description: 'Baju Kerja', date: `${year}-${month}-15` },
  ];

  demoTx.forEach((tx, i) => {
    const id = `demo-${i}`;
    const all: Transaction[] = JSON.parse(localStorage.getItem('fin_transactions') || '[]');
    all.unshift({ ...tx, id, createdAt: new Date().toISOString() });
    localStorage.setItem('fin_transactions', JSON.stringify(all));
  });

  // Demo savings goals
  const goalsExist = localStorage.getItem('fin_savings_goals');
  if (!goalsExist || JSON.parse(goalsExist).length === 0) {
    const goals: SavingsGoal[] = [
      { id: 'g1', name: 'Dana Darurat', targetAmount: 30000000, currentAmount: 12000000, deadline: `${year + 1}-06-01`, color: 'emerald', icon: '🛡️', createdAt: new Date().toISOString() },
      { id: 'g2', name: 'Liburan Bali', targetAmount: 5000000, currentAmount: 2500000, deadline: `${year}-12-31`, color: 'blue', icon: '✈️', createdAt: new Date().toISOString() },
      { id: 'g3', name: 'Rumah Idaman', targetAmount: 100000000, currentAmount: 15000000, deadline: `${year + 3}-01-01`, color: 'amber', icon: '🏠', createdAt: new Date().toISOString() },
    ];
    localStorage.setItem('fin_savings_goals', JSON.stringify(goals));
  }

  // Demo portfolio
  const portfolioExist = localStorage.getItem('fin_portfolio');
  if (!portfolioExist || JSON.parse(portfolioExist).length === 0) {
    const portfolio = [
      { id: 'p1', name: 'Bank BCA', ticker: 'BBCA', type: 'stock', buyPrice: 9200, currentPrice: 9800, quantity: 100, buyDate: `${year}-01-15`, notes: 'Blue chip perbankan' },
      { id: 'p2', name: 'Bitcoin', ticker: 'BTC', type: 'crypto', buyPrice: 400000000, currentPrice: 480000000, quantity: 0.05, buyDate: `${year}-02-01`, notes: 'Crypto utama' },
      { id: 'p3', name: 'Reksa Dana Campuran', ticker: '', type: 'mutual_fund', buyPrice: 10000, currentPrice: 11200, quantity: 500, buyDate: `${year}-03-10`, notes: 'Diversifikasi' },
    ];
    localStorage.setItem('fin_portfolio', JSON.stringify(portfolio));
  }
}

// ─── Last 6 months chart data ─────────────────────────────────────────────
function getLast6MonthsData() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const summary = getFinancialSummary(key);
    months.push({
      name: d.toLocaleString('id-ID', { month: 'short' }),
      Pemasukan: summary.totalIncome,
      Pengeluaran: summary.totalExpense,
    });
  }
  return months;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl text-sm">
        <p className="text-slate-300 font-medium mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.fill }} className="font-semibold">
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// ─── Quick Add Transaction Modal ──────────────────────────────────────────
function QuickAddModal({ isOpen, onClose, defaultType }: { isOpen: boolean; onClose: () => void; defaultType: 'income' | 'expense' }) {
  const [type, setType] = useState<'income' | 'expense'>(defaultType);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    setType(defaultType);
    setCategory('');
    setDate(new Date().toISOString().split('T')[0]);
  }, [defaultType, isOpen]);

  const incomeCategories = [
    { value: 'salary', label: '💼 Gaji' },
    { value: 'freelance', label: '💻 Freelance' },
    { value: 'investment_return', label: '📈 Hasil Investasi' },
    { value: 'gift', label: '🎁 Hadiah/Bonus' },
    { value: 'other_income', label: '💰 Pemasukan Lain' },
  ];
  const expenseCategories = [
    { value: 'food', label: '🍜 Makanan & Minuman' },
    { value: 'transport', label: '🚗 Transportasi' },
    { value: 'housing', label: '🏠 Tempat Tinggal' },
    { value: 'utilities', label: '💡 Tagihan & Utilitas' },
    { value: 'entertainment', label: '🎬 Hiburan' },
    { value: 'health', label: '❤️ Kesehatan' },
    { value: 'education', label: '📚 Pendidikan' },
    { value: 'shopping', label: '🛍️ Belanja' },
    { value: 'insurance', label: '🛡️ Asuransi' },
    { value: 'debt_payment', label: '💳 Cicilan/Hutang' },
    { value: 'other_expense', label: '📝 Pengeluaran Lain' },
  ];

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !amount || !description || !date) return;
    addTransaction({ type, category: category as any, amount: Number(amount), description, date });
    onClose();
    setAmount(''); setDescription(''); setCategory('');
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === 'income' ? '💚 Catat Pemasukan' : '🔴 Catat Pengeluaran'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex rounded-xl overflow-hidden border border-slate-700">
          <button type="button" onClick={() => setType('income')} className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${type === 'income' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>💚 Pemasukan</button>
          <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${type === 'expense' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>🔴 Pengeluaran</button>
        </div>
        <Select label="Kategori" value={category} onChange={e => setCategory(e.target.value)} required options={[{ value: '', label: 'Pilih kategori...' }, ...categories]} />
        <Input label="Jumlah (Rp)" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" required min="1" />
        <Input label="Keterangan" value={description} onChange={e => setDescription(e.target.value)} placeholder="Keterangan transaksi..." required />
        <Input label="Tanggal" type="date" value={date} onChange={e => setDate(e.target.value)} required />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Batal</Button>
          <Button type="submit" variant="primary" className="flex-1">{type === 'income' ? 'Simpan Pemasukan' : 'Simpan Pengeluaran'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Tips Keuangan ────────────────────────────────────────────────────────
const tips = [
  { icon: '💡', text: 'Ikuti aturan 50/30/20: 50% kebutuhan, 30% keinginan, 20% tabungan & investasi.' },
  { icon: '🛡️', text: 'Dana darurat ideal adalah 6× pengeluaran bulanan. Simpan di rekening terpisah.' },
  { icon: '📈', text: 'Mulai investasi sejak dini. Compound interest bekerja lebih baik dengan waktu yang panjang.' },
  { icon: '💳', text: 'Hindari utang konsumtif. Jika punya cicilan, lunasi yang bunga tertinggi lebih dulu.' },
  { icon: '🎯', text: 'Catat setiap pengeluaran. Kesadaran finansial adalah langkah pertama menuju kebebasan finansial.' },
];

// ─── Main Dashboard Component ─────────────────────────────────────────────
export default function Dashboard() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');
  const [tipIndex, setTipIndex] = useState(0);

  const load = useCallback(() => {
    setSummary(getFinancialSummary(getCurrentMonth()));
    setRecentTx(getTransactions().slice(0, 5));
    setGoals(getSavingsGoals().slice(0, 3));
    setChartData(getLast6MonthsData());
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTipIndex(Math.floor(Math.random() * tips.length));
      seedDemoData();
      load();
    }
  }, [load]);

  function openModal(type: 'income' | 'expense') {
    setModalType(type);
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
    load();
  }

  const totalSavings = getSavingsGoals().reduce((s, g) => s + g.currentAmount, 0);
  const portfolioAssets = getPortfolio();
  const portfolioValue = portfolioAssets.reduce((s, a) => s + a.currentPrice * a.quantity, 0);
  const portfolioCost = portfolioAssets.reduce((s, a) => s + a.buyPrice * a.quantity, 0);
  const portfolioReturn = portfolioCost > 0 ? ((portfolioValue - portfolioCost) / portfolioCost) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => openModal('income')} className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 hover:scale-105 active:scale-95">
          <span className="text-lg">💚</span> Catat Pemasukan
        </button>
        <button onClick={() => openModal('expense')} className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-900/30 hover:shadow-red-900/50 hover:scale-105 active:scale-95">
          <span className="text-lg">🔴</span> Catat Pengeluaran
        </button>
        <Link href="/transaksi" className="flex items-center gap-2 px-5 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95">
          <span className="text-lg">📋</span> Semua Transaksi
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-900/60 to-emerald-800/30 border border-emerald-700/40 rounded-2xl p-5 backdrop-blur-sm">
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-1">💰 Saldo Bulan Ini</p>
          <p className={`text-2xl font-bold mt-1 ${(summary?.balance ?? 0) >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>{formatCurrency(summary?.balance ?? 0)}</p>
          <p className="text-slate-400 text-xs mt-2">Tabungan: {summary?.savingsRate ?? 0}% dari pemasukan</p>
        </div>
        <div className="bg-gradient-to-br from-blue-900/60 to-blue-800/30 border border-blue-700/40 rounded-2xl p-5 backdrop-blur-sm">
          <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-1">🎯 Total Tabungan</p>
          <p className="text-2xl font-bold text-blue-300 mt-1">{formatCurrency(totalSavings)}</p>
          <p className="text-slate-400 text-xs mt-2">{getSavingsGoals().length} target tabungan aktif</p>
        </div>
        <div className="bg-gradient-to-br from-purple-900/60 to-purple-800/30 border border-purple-700/40 rounded-2xl p-5 backdrop-blur-sm">
          <p className="text-purple-400 text-xs font-semibold uppercase tracking-widest mb-1">📈 Nilai Portfolio</p>
          <p className="text-2xl font-bold text-purple-300 mt-1">{formatCurrency(portfolioValue)}</p>
          <p className={`text-xs mt-2 ${portfolioReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{portfolioReturn >= 0 ? '▲' : '▼'} {Math.abs(portfolioReturn).toFixed(1)}% return</p>
        </div>
        <div className="bg-gradient-to-br from-amber-900/60 to-amber-800/30 border border-amber-700/40 rounded-2xl p-5 backdrop-blur-sm">
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">💎 Kekayaan Bersih</p>
          <p className="text-2xl font-bold text-amber-300 mt-1">{formatCurrency(summary?.netWorth ?? 0)}</p>
          <p className="text-slate-400 text-xs mt-2">Aset – Kewajiban</p>
        </div>
      </div>

      {/* Chart + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-slate-200 font-semibold mb-4">📊 Pemasukan vs Pengeluaran (6 Bulan)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(0)}jt`} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-200 font-semibold">🕐 Transaksi Terbaru</h3>
            <Link href="/transaksi" className="text-emerald-400 text-xs hover:text-emerald-300 transition-colors">Lihat semua →</Link>
          </div>
          <div className="flex-1 space-y-3">
            {recentTx.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">Belum ada transaksi</p>
            ) : recentTx.map(tx => (
              <div key={tx.id} className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{getCategoryIcon(tx.category)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium truncate">{tx.description}</p>
                  <p className="text-slate-500 text-xs">{getCategoryLabel(tx.category)} · {formatDate(tx.date)}</p>
                </div>
                <span className={`text-sm font-semibold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Savings Goals + Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Savings Goals */}
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-200 font-semibold">🎯 Target Tabungan</h3>
            <Link href="/tabungan" className="text-emerald-400 text-xs hover:text-emerald-300 transition-colors">Kelola →</Link>
          </div>
          <div className="space-y-4">
            {goals.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">Belum ada target tabungan. <Link href="/tabungan" className="text-emerald-400 hover:underline">Tambah sekarang →</Link></p>
            ) : goals.map(goal => {
              const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
              const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000);
              return (
                <div key={goal.id}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{goal.icon}</span>
                    <span className="text-slate-200 text-sm font-medium flex-1">{goal.name}</span>
                    <span className="text-slate-400 text-xs">{pct}%</span>
                    <span className="text-slate-500 text-xs">{daysLeft > 0 ? `${daysLeft} hari lagi` : 'Jatuh tempo!'}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? 'bg-emerald-400' : pct >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-400 text-xs">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-slate-500 text-xs">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h3 className="text-slate-200 font-semibold mb-3">💡 Tips Keuangan</h3>
            <div className="text-4xl mb-3">{tips[tipIndex].icon}</div>
            <p className="text-slate-300 text-sm leading-relaxed">{tips[tipIndex].text}</p>
          </div>
          <div className="mt-6 p-4 bg-emerald-900/30 border border-emerald-700/30 rounded-xl">
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-1">📊 Tingkat Tabungan Bulan Ini</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">{summary?.savingsRate ?? 0}%</span>
              <span className="text-slate-400 text-sm mb-1">dari pemasukan</span>
            </div>
            <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, summary?.savingsRate ?? 0)}%` }} />
            </div>
            <p className="text-slate-500 text-xs mt-1.5">Target ideal: ≥20%</p>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal isOpen={modalOpen} onClose={handleModalClose} defaultType={modalType} />
    </div>
  );
}
