'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { SavingsGoal } from '@/types';
import {
  getSavingsGoals,
  addSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  addToSavingsGoal,
} from '@/lib/storage';
import {
  cn,
  formatCurrency,
  formatDate,
  calculatePercentage,
} from '@/lib/utils';

// ─── Constants ──────────────────────────────────────────────────────────────

const SUGGESTED_GOALS = [
  { name: 'Dana Darurat', icon: '🛡️', color: '#10b981', targetAmount: 72000000, description: '6x pengeluaran bulanan' },
  { name: 'Dana Pensiun', icon: '🏖️', color: '#3b82f6', targetAmount: 500000000, description: 'Persiapan masa tua' },
  { name: 'Dana Pendidikan Anak', icon: '🎓', color: '#8b5cf6', targetAmount: 200000000, description: 'Biaya pendidikan' },
  { name: 'Liburan', icon: '✈️', color: '#f59e0b', targetAmount: 15000000, description: 'Liburan impian' },
  { name: 'Rumah', icon: '🏠', color: '#ec4899', targetAmount: 300000000, description: 'DP rumah pertama' },
];

const GOAL_ICONS = ['🎯', '🛡️', '🏖️', '🎓', '✈️', '🏠', '🚗', '💍', '📱', '💰', '🏥', '🎁'];
const GOAL_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444', '#f97316', '#14b8a6', '#6366f1'];

// ─── Demo Data ──────────────────────────────────────────────────────────────

function generateDemoGoals(): void {
  const sixMonthsLater = new Date();
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const twoYearsLater = new Date();
  twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2);

  const demos: Array<Omit<SavingsGoal, 'id' | 'createdAt'>> = [
    {
      name: 'Dana Darurat',
      targetAmount: 72000000,
      currentAmount: 35000000,
      deadline: sixMonthsLater.toISOString().split('T')[0],
      color: '#10b981',
      icon: '🛡️',
    },
    {
      name: 'Liburan ke Jepang',
      targetAmount: 25000000,
      currentAmount: 12500000,
      deadline: oneYearLater.toISOString().split('T')[0],
      color: '#f59e0b',
      icon: '✈️',
    },
    {
      name: 'DP Rumah',
      targetAmount: 150000000,
      currentAmount: 45000000,
      deadline: twoYearsLater.toISOString().split('T')[0],
      color: '#ec4899',
      icon: '🏠',
    },
    {
      name: 'iPhone Baru',
      targetAmount: 20000000,
      currentAmount: 20000000,
      deadline: new Date().toISOString().split('T')[0],
      color: '#3b82f6',
      icon: '📱',
    },
  ];

  demos.forEach((g) => addSavingsGoal(g));
}

// ─── Add Goal Modal ─────────────────────────────────────────────────────────

function AddGoalModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
}) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');
  const [selectedColor, setSelectedColor] = useState('#10b981');
  const [showSuggestions, setShowSuggestions] = useState(true);

  const handleAmountChange = (val: string) => {
    const clean = val.replace(/[^\d]/g, '');
    if (clean === '') {
      setTargetAmount('');
      return;
    }
    setTargetAmount(parseInt(clean, 10).toLocaleString('id-ID'));
  };

  const handleUseSuggestion = (suggestion: typeof SUGGESTED_GOALS[0]) => {
    setName(suggestion.name);
    setTargetAmount(suggestion.targetAmount.toLocaleString('id-ID'));
    setSelectedIcon(suggestion.icon);
    setSelectedColor(suggestion.color);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(targetAmount.replace(/\./g, ''));
    if (!name || !numAmount || !deadline) return;

    addSavingsGoal({
      name,
      targetAmount: numAmount,
      currentAmount: 0,
      deadline,
      icon: selectedIcon,
      color: selectedColor,
    });

    setName('');
    setTargetAmount('');
    setDeadline('');
    setSelectedIcon('🎯');
    setSelectedColor('#10b981');
    setShowSuggestions(true);
    onAdd();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">🎯 Tambah Target Tabungan</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Suggestions */}
          {showSuggestions && (
            <div className="mb-6">
              <p className="text-sm text-zinc-400 mb-3">💡 Saran target tabungan:</p>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTED_GOALS.map((sg) => (
                  <button
                    key={sg.name}
                    onClick={() => handleUseSuggestion(sg)}
                    className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-left hover:border-emerald-500/50 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{sg.icon}</span>
                      <span className="text-white text-sm font-medium group-hover:text-emerald-400 transition-colors">
                        {sg.name}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-xs">{sg.description}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowSuggestions(false)}
                className="mt-2 text-emerald-400 text-sm hover:underline"
              >
                Atau buat target sendiri →
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Nama Target</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Dana Darurat"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-600 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Target Jumlah (Rp)</label>
              <input
                type="text"
                value={targetAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-600 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                required
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Ikon</label>
              <div className="flex flex-wrap gap-2">
                {GOAL_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-200',
                      selectedIcon === icon
                        ? 'bg-emerald-600 ring-2 ring-emerald-400 scale-110'
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Warna</label>
              <div className="flex flex-wrap gap-2">
                {GOAL_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all duration-200',
                      selectedColor === color
                        ? 'ring-2 ring-offset-2 ring-offset-zinc-900 scale-110'
                        : 'hover:scale-110'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Buat Target
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Add Fund Modal ─────────────────────────────────────────────────────────

function AddFundModal({
  isOpen,
  onClose,
  onAdd,
  goal,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  goal: SavingsGoal | null;
}) {
  const [amount, setAmount] = useState('');

  const handleAmountChange = (val: string) => {
    const clean = val.replace(/[^\d]/g, '');
    if (clean === '') {
      setAmount('');
      return;
    }
    setAmount(parseInt(clean, 10).toLocaleString('id-ID'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal) return;
    const numAmount = parseFloat(amount.replace(/\./g, ''));
    if (!numAmount || numAmount <= 0) return;

    addToSavingsGoal(goal.id, numAmount);
    setAmount('');
    onAdd();
    onClose();
  };

  if (!isOpen || !goal) return null;

  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-lg font-bold text-white mb-2">
          {goal.icon} Tambah Dana
        </h2>
        <p className="text-zinc-400 text-sm mb-4">
          {goal.name} — Sisa{' '}
          <span className="text-emerald-400 font-medium">
            {formatCurrency(Math.max(remaining, 0))}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Jumlah Dana (Rp)
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-600 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              autoFocus
              required
            />
          </div>

          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setAmount(remaining.toLocaleString('id-ID'))}
              className="text-sm text-emerald-400 hover:underline"
            >
              Isi penuh ({formatCurrency(remaining)})
            </button>
          )}

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
              Tambah
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Goal Modal ──────────────────────────────────────────────────────

function DeleteGoalModal({
  isOpen,
  onClose,
  onConfirm,
  goalName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  goalName: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center">
          <div className="text-4xl mb-3">🗑️</div>
          <h3 className="text-lg font-bold text-white mb-2">Hapus Target?</h3>
          <p className="text-zinc-400 text-sm mb-6">
            Target &quot;{goalName}&quot; akan dihapus secara permanen.
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

// ─── Goal Card Component ────────────────────────────────────────────────────

function GoalCard({
  goal,
  onAddFund,
  onDelete,
}: {
  goal: SavingsGoal;
  onAddFund: () => void;
  onDelete: () => void;
}) {
  const percentage = calculatePercentage(goal.currentAmount, goal.targetAmount);
  const isCompleted = goal.currentAmount >= goal.targetAmount;

  const deadlineDate = new Date(goal.deadline);
  const today = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  const isOverdue = !isCompleted && daysRemaining === 0;

  return (
    <div
      className={cn(
        'relative bg-zinc-900/80 border rounded-2xl p-5 transition-all duration-300 hover:shadow-lg group overflow-hidden',
        isCompleted
          ? 'border-emerald-500/50 hover:shadow-emerald-500/10'
          : isOverdue
          ? 'border-red-500/50'
          : 'border-zinc-800 hover:border-zinc-700'
      )}
    >
      {/* Celebration for completed goals */}
      {isCompleted && (
        <div className="absolute top-2 right-2 text-2xl animate-bounce">
          🎉
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
            style={{ backgroundColor: `${goal.color}20` }}
          >
            {goal.icon}
          </div>
          <div>
            <h3 className="text-white font-semibold">{goal.name}</h3>
            <p className="text-zinc-500 text-xs mt-0.5">
              {isCompleted ? (
                <span className="text-emerald-400 font-medium">✅ Tercapai!</span>
              ) : isOverdue ? (
                <span className="text-red-400 font-medium">⏰ Melewati deadline</span>
              ) : (
                <span>{daysRemaining} hari tersisa</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
          title="Hapus target"
        >
          🗑️
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${percentage}%`,
              backgroundColor: isCompleted ? '#10b981' : goal.color,
            }}
          />
        </div>
      </div>

      {/* Amount Info */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white font-bold text-lg">
            {formatCurrency(goal.currentAmount)}
          </p>
          <p className="text-zinc-500 text-xs">
            dari {formatCurrency(goal.targetAmount)}
          </p>
        </div>
        <div className="text-right">
          <p
            className="font-bold text-lg"
            style={{ color: isCompleted ? '#10b981' : goal.color }}
          >
            {percentage}%
          </p>
          <p className="text-zinc-500 text-xs">
            Deadline: {formatDate(goal.deadline)}
          </p>
        </div>
      </div>

      {/* Add Fund Button */}
      {!isCompleted && (
        <button
          onClick={onAddFund}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: `${goal.color}20`,
            color: goal.color,
          }}
        >
          + Tambah Dana
        </button>
      )}

      {/* Completed state */}
      {isCompleted && (
        <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-emerald-500/20 text-emerald-400">
          🎊 Target Tercapai! 🎊
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [fundTarget, setFundTarget] = useState<SavingsGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null);
  const [mounted, setMounted] = useState(false);

  const loadGoals = useCallback(() => {
    const existing = getSavingsGoals();
    if (existing.length === 0) {
      generateDemoGoals();
    }
    setGoals(getSavingsGoals());
  }, []);

  useEffect(() => {
    setMounted(true);
    loadGoals();
  }, [loadGoals]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteSavingsGoal(deleteTarget.id);
    setDeleteTarget(null);
    loadGoals();
  };

  // Summary
  const summary = useMemo(() => {
    const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
    const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
    const completedCount = goals.filter(
      (g) => g.currentAmount >= g.targetAmount
    ).length;
    return { totalTarget, totalSaved, completedCount, total: goals.length };
  }, [goals]);

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
          <h1 className="text-2xl font-bold text-white">Target Tabungan</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Lacak dan kelola target keuangan Anda
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          + Tambah Target
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-lg">🎯</div>
            <span className="text-sm text-zinc-400">Total Target</span>
          </div>
          <p className="text-2xl font-bold text-white">{goals.length}</p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-lg">💰</div>
            <span className="text-sm text-zinc-400">Total Terkumpul</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {formatCurrency(summary.totalSaved)}
          </p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-lg">📊</div>
            <span className="text-sm text-zinc-400">Target Total</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(summary.totalTarget)}
          </p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-lg">🏆</div>
            <span className="text-sm text-zinc-400">Tercapai</span>
          </div>
          <p className="text-2xl font-bold text-white">
            <span className="text-emerald-400">{summary.completedCount}</span>
            <span className="text-zinc-500 text-lg"> / {summary.total}</span>
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      {goals.length > 0 && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Progress Keseluruhan</h3>
            <span className="text-emerald-400 font-bold">
              {calculatePercentage(summary.totalSaved, summary.totalTarget)}%
            </span>
          </div>
          <div className="w-full h-4 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${calculatePercentage(summary.totalSaved, summary.totalTarget)}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-zinc-500">
            <span>Terkumpul: {formatCurrency(summary.totalSaved)}</span>
            <span>Total: {formatCurrency(summary.totalTarget)}</span>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <span className="text-4xl mb-3">🎯</span>
          <p className="font-medium">Belum ada target tabungan</p>
          <p className="text-sm mt-1">Mulai buat target untuk meraih impian finansial Anda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onAddFund={() => setFundTarget(goal)}
              onDelete={() => setDeleteTarget(goal)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddGoalModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={loadGoals}
      />
      <AddFundModal
        isOpen={!!fundTarget}
        onClose={() => setFundTarget(null)}
        onAdd={loadGoals}
        goal={fundTarget}
      />
      <DeleteGoalModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        goalName={deleteTarget?.name ?? ''}
      />
    </div>
  );
}
