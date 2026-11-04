'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getPortfolio, getSavingsGoals, getTransactions, getData, saveData } from '@/lib/storage';
import { formatCurrency, getCurrentMonth, formatMonth } from '@/lib/utils';

const LIABILITIES_KEY = 'fin_liabilities';

interface LiabilityItem {
  id: string;
  name: string;
  amount: number;
}

interface NetWorthSnapshot {
  month: string;
  label: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

function getLiabilities(): LiabilityItem[] {
  return getData<LiabilityItem[]>(LIABILITIES_KEY) ?? [];
}

function saveLiabilities(items: LiabilityItem[]) {
  saveData(LIABILITIES_KEY, items);
}

function getNetWorthHistory(): NetWorthSnapshot[] {
  return getData<NetWorthSnapshot[]>('fin_networth_history') ?? [];
}

function saveNetWorthSnapshot(snapshot: NetWorthSnapshot) {
  const history = getNetWorthHistory();
  const idx = history.findIndex(h => h.month === snapshot.month);
  if (idx >= 0) history[idx] = snapshot;
  else history.push(snapshot);
  history.sort((a, b) => a.month.localeCompare(b.month));
  saveData('fin_networth_history', history);
}

function computeCurrentAssets(): { portfolio: number; savings: number; cash: number; total: number } {
  const portfolio = getPortfolio().reduce((s, a) => s + a.currentPrice * a.quantity, 0);
  const savings = getSavingsGoals().reduce((s, g) => s + g.currentAmount, 0);
  // Cash = all-time income - all-time expense (rough estimate)
  const txs = getTransactions();
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const cash = Math.max(0, income - expense - savings);
  return { portfolio, savings, cash, total: portfolio + savings + cash };
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl text-sm">
        <p className="text-slate-300 font-semibold mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.stroke }} className="font-medium">{p.name}: {formatCurrency(p.value)}</p>
        ))}
      </div>
    );
  }
  return null;
}

export default function NetWorthTracker() {
  const [liabilities, setLiabilities] = useState<LiabilityItem[]>([]);
  const [assets, setAssets] = useState({ portfolio: 0, savings: 0, cash: 0, total: 0 });
  const [history, setHistory] = useState<NetWorthSnapshot[]>([]);
  const [newLiab, setNewLiab] = useState({ name: '', amount: '' });
  const [editLiabId, setEditLiabId] = useState<string | null>(null);
  const [showAddLiab, setShowAddLiab] = useState(false);

  const load = useCallback(() => {
    const liabs = getLiabilities();
    setLiabilities(liabs);
    const computedAssets = computeCurrentAssets();
    setAssets(computedAssets);
    const totalLiabs = liabs.reduce((s, l) => s + l.amount, 0);
    const netWorth = computedAssets.total - totalLiabs;
    const now = getCurrentMonth();
    const snap: NetWorthSnapshot = {
      month: now,
      label: formatMonth(now).split(' ')[0].substring(0, 3) + ' ' + formatMonth(now).split(' ')[1],
      assets: computedAssets.total,
      liabilities: totalLiabs,
      netWorth,
    };
    saveNetWorthSnapshot(snap);
    setHistory(getNetWorthHistory());
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalLiabs = liabilities.reduce((s, l) => s + l.amount, 0);
  const netWorth = assets.total - totalLiabs;

  function addLiability() {
    if (!newLiab.name || !newLiab.amount) return;
    const updated = [...liabilities, { id: Date.now().toString(), name: newLiab.name, amount: Number(newLiab.amount) }];
    saveLiabilities(updated);
    setNewLiab({ name: '', amount: '' });
    setShowAddLiab(false);
    load();
  }

  function deleteLiability(id: string) {
    const updated = liabilities.filter(l => l.id !== id);
    saveLiabilities(updated);
    load();
  }

  function updateLiability(id: string, name: string, amount: number) {
    const updated = liabilities.map(l => l.id === id ? { ...l, name, amount } : l);
    saveLiabilities(updated);
    setEditLiabId(null);
    load();
  }

  const chartData = history.length > 0 ? history.slice(-12).map(h => ({
    name: h.label,
    'Kekayaan Bersih': h.netWorth,
    'Total Aset': h.assets,
    'Kewajiban': h.liabilities,
  })) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">💎 Kekayaan Bersih</h2>
        <p className="text-slate-400 text-sm mt-0.5">Total aset dikurangi total kewajiban (hutang)</p>
      </div>

      {/* Net Worth Hero */}
      <div className="bg-gradient-to-br from-emerald-900/50 to-blue-900/30 border border-emerald-700/40 rounded-2xl p-8 text-center">
        <p className="text-slate-400 text-sm uppercase tracking-widest font-semibold mb-2">Kekayaan Bersih Saat Ini</p>
        <p className={`text-5xl font-bold mb-2 ${netWorth >= 0 ? 'text-white' : 'text-red-400'}`}>{formatCurrency(netWorth)}</p>
        <p className="text-slate-400 text-sm">{formatCurrency(assets.total)} aset − {formatCurrency(totalLiabs)} kewajiban</p>
        <div className="mt-6 flex justify-center gap-8">
          <div className="text-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full mx-auto mb-1"></div>
            <p className="text-slate-400 text-xs">Total Aset</p>
            <p className="text-emerald-300 font-bold text-lg">{formatCurrency(assets.total)}</p>
          </div>
          <div className="text-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
            <p className="text-slate-400 text-xs">Total Kewajiban</p>
            <p className="text-red-400 font-bold text-lg">{formatCurrency(totalLiabs)}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-slate-200 font-semibold mb-4">📊 Tren Kekayaan Bersih</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorNW" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v / 1e6).toFixed(0)}jt`} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Kekayaan Bersih" stroke="#10b981" strokeWidth={2} fill="url(#colorNW)" />
              <Area type="monotone" dataKey="Total Aset" stroke="#3b82f6" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
              <Area type="monotone" dataKey="Kewajiban" stroke="#f43f5e" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Asset Breakdown + Liabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-slate-200 font-semibold mb-4">✅ Rincian Aset</h3>
          <div className="space-y-3">
            {[
              { label: '📈 Portfolio Investasi', value: assets.portfolio, color: 'emerald' },
              { label: '🎯 Total Tabungan (Goal)', value: assets.savings, color: 'blue' },
              { label: '💵 Kas / Saldo Bersih', value: assets.cash, color: 'amber' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                <div>
                  <p className="text-slate-200 text-sm font-medium">{item.label}</p>
                  <div className="mt-1.5 h-1.5 w-32 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-${item.color}-500 transition-all duration-700`}
                      style={{ width: assets.total > 0 ? `${(item.value / assets.total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{formatCurrency(item.value)}</p>
                  <p className="text-slate-500 text-xs">{assets.total > 0 ? ((item.value / assets.total) * 100).toFixed(1) : 0}%</p>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <p className="text-slate-300 font-semibold">Total Aset</p>
              <p className="text-emerald-400 font-bold text-lg">{formatCurrency(assets.total)}</p>
            </div>
          </div>
        </div>

        {/* Liabilities */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-200 font-semibold">🔴 Kewajiban / Hutang</h3>
            <button onClick={() => setShowAddLiab(!showAddLiab)} className="text-sm text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">+ Tambah</button>
          </div>

          {showAddLiab && (
            <div className="bg-slate-700/50 rounded-xl p-4 mb-4 space-y-3">
              <input
                type="text"
                value={newLiab.name}
                onChange={e => setNewLiab(p => ({ ...p, name: e.target.value }))}
                placeholder="cth. KPR, Kartu Kredit, Motor..."
                className="w-full bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                value={newLiab.amount}
                onChange={e => setNewLiab(p => ({ ...p, amount: e.target.value }))}
                placeholder="Jumlah hutang (Rp)"
                className="w-full bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowAddLiab(false)} className="flex-1 py-2 text-sm bg-slate-600 text-slate-300 rounded-lg hover:bg-slate-500 transition-colors">Batal</button>
                <button onClick={addLiability} className="flex-1 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-semibold">Simpan</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {liabilities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-slate-400 text-sm">Tidak ada hutang tercatat</p>
                <p className="text-slate-500 text-xs mt-1">Pertahankan kondisi ini!</p>
              </div>
            ) : liabilities.map(liab => (
              <div key={liab.id}>
                {editLiabId === liab.id ? (
                  <LiabEditRow liab={liab} onSave={(n, a) => updateLiability(liab.id, n, a)} onCancel={() => setEditLiabId(null)} />
                ) : (
                  <div className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                    <div>
                      <p className="text-slate-200 text-sm font-medium">{liab.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-red-400 font-semibold">{formatCurrency(liab.amount)}</p>
                      <button onClick={() => setEditLiabId(liab.id)} className="text-slate-500 hover:text-blue-400 text-sm transition-colors">✏️</button>
                      <button onClick={() => deleteLiability(liab.id)} className="text-slate-500 hover:text-red-400 text-sm transition-colors">🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {liabilities.length > 0 && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-slate-300 font-semibold">Total Kewajiban</p>
                <p className="text-red-400 font-bold text-lg">{formatCurrency(totalLiabs)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Health */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
        <h3 className="text-slate-200 font-semibold mb-4">🏥 Kesehatan Finansial</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Rasio Hutang terhadap Aset',
              value: assets.total > 0 ? `${((totalLiabs / assets.total) * 100).toFixed(1)}%` : '0%',
              status: assets.total > 0 && (totalLiabs / assets.total) < 0.3 ? 'Baik' : (totalLiabs / assets.total) < 0.5 ? 'Perhatian' : 'Berbahaya',
              statusColor: assets.total > 0 && (totalLiabs / assets.total) < 0.3 ? 'text-emerald-400' : (totalLiabs / assets.total) < 0.5 ? 'text-amber-400' : 'text-red-400',
              desc: 'Ideal: < 30%',
            },
            {
              label: 'Diversifikasi Aset',
              value: `${getPortfolio().length} instrumen`,
              status: getPortfolio().length >= 5 ? 'Baik' : getPortfolio().length >= 2 ? 'Cukup' : 'Kurang',
              statusColor: getPortfolio().length >= 5 ? 'text-emerald-400' : getPortfolio().length >= 2 ? 'text-amber-400' : 'text-red-400',
              desc: 'Ideal: ≥ 5 instrumen',
            },
            {
              label: 'Dana Darurat (Goal)',
              value: (() => { const g = getSavingsGoals().find(g => g.name.toLowerCase().includes('darurat')); return g ? `${Math.round((g.currentAmount / g.targetAmount) * 100)}%` : 'Belum ada'; })(),
              status: (() => { const g = getSavingsGoals().find(g => g.name.toLowerCase().includes('darurat')); return g && g.currentAmount >= g.targetAmount ? 'Terpenuhi' : g ? 'Proses' : 'Belum Ada'; })(),
              statusColor: (() => { const g = getSavingsGoals().find(g => g.name.toLowerCase().includes('darurat')); return g && g.currentAmount >= g.targetAmount ? 'text-emerald-400' : g ? 'text-amber-400' : 'text-red-400'; })(),
              desc: 'Target: 6× pengeluaran',
            },
          ].map(item => (
            <div key={item.label} className="bg-slate-700/40 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-1">{item.label}</p>
              <p className="text-white text-xl font-bold">{item.value}</p>
              <p className={`text-sm font-semibold ${item.statusColor}`}>{item.status}</p>
              <p className="text-slate-500 text-xs mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiabEditRow({ liab, onSave, onCancel }: { liab: LiabilityItem; onSave: (n: string, a: number) => void; onCancel: () => void }) {
  const [name, setName] = useState(liab.name);
  const [amount, setAmount] = useState(String(liab.amount));
  return (
    <div className="flex gap-2 py-2 items-center">
      <input value={name} onChange={e => setName(e.target.value)} className="flex-1 bg-slate-600 text-sm text-white rounded-lg px-2 py-1.5 border border-slate-500 focus:outline-none focus:border-emerald-500" />
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-32 bg-slate-600 text-sm text-white rounded-lg px-2 py-1.5 border border-slate-500 focus:outline-none focus:border-emerald-500" />
      <button onClick={() => onSave(name, Number(amount))} className="text-emerald-400 hover:text-emerald-300 font-semibold text-sm">✓</button>
      <button onClick={onCancel} className="text-slate-500 hover:text-slate-400 text-sm">✕</button>
    </div>
  );
}
