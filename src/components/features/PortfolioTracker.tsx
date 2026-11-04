'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getPortfolio, addAsset, updateAsset, deleteAsset } from '@/lib/storage';
import { formatCurrency, getAssetTypeLabel } from '@/lib/utils';
import { PortfolioAsset, AssetType } from '@/types';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

const ASSET_COLORS: Record<AssetType, string> = {
  stock: '#10b981',
  crypto: '#f59e0b',
  mutual_fund: '#3b82f6',
  bond: '#8b5cf6',
  gold: '#fbbf24',
  deposit: '#06b6d4',
  property: '#f97316',
  other: '#6b7280',
};

const ASSET_ICONS: Record<AssetType, string> = {
  stock: '📈',
  crypto: '₿',
  mutual_fund: '📊',
  bond: '🏛️',
  gold: '🥇',
  deposit: '🏦',
  property: '🏠',
  other: '💼',
};

const ASSET_TYPES: AssetType[] = ['stock', 'crypto', 'mutual_fund', 'bond', 'gold', 'deposit', 'property', 'other'];

function CustomPieTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl text-sm">
        <p className="text-white font-semibold">{payload[0].name}</p>
        <p className="text-slate-300">{formatCurrency(payload[0].value)}</p>
        <p className="text-slate-400">{payload[0].payload.percent?.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
}

interface AssetFormData {
  name: string;
  ticker: string;
  type: AssetType;
  buyPrice: string;
  currentPrice: string;
  quantity: string;
  buyDate: string;
  notes: string;
}

const defaultForm: AssetFormData = {
  name: '', ticker: '', type: 'stock',
  buyPrice: '', currentPrice: '', quantity: '',
  buyDate: '', notes: '',
};

export default function PortfolioTracker() {
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<PortfolioAsset | null>(null);
  const [form, setForm] = useState<AssetFormData>(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editPriceId, setEditPriceId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all');

  const load = useCallback(() => setAssets(getPortfolio()), []);

  useEffect(() => { load(); }, [load]);

  // Portfolio calculations
  const totalValue = assets.reduce((s, a) => s + a.currentPrice * a.quantity, 0);
  const totalCost = assets.reduce((s, a) => s + a.buyPrice * a.quantity, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalReturn = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  // Pie chart data
  const byType = ASSET_TYPES.map(type => {
    const val = assets.filter(a => a.type === type).reduce((s, a) => s + a.currentPrice * a.quantity, 0);
    return { name: getAssetTypeLabel(type), value: val, type, percent: totalValue > 0 ? (val / totalValue) * 100 : 0 };
  }).filter(d => d.value > 0);

  const filtered = filterType === 'all' ? assets : assets.filter(a => a.type === filterType);

  function openAdd() {
    setEditAsset(null);
    setForm({
      ...defaultForm,
      buyDate: new Date().toISOString().split('T')[0],
    });
    setModalOpen(true);
  }

  function openEdit(asset: PortfolioAsset) {
    setEditAsset(asset);
    setForm({
      name: asset.name, ticker: asset.ticker ?? '', type: asset.type,
      buyPrice: String(asset.buyPrice), currentPrice: String(asset.currentPrice),
      quantity: String(asset.quantity), buyDate: asset.buyDate, notes: asset.notes ?? '',
    });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name: form.name, ticker: form.ticker, type: form.type,
      buyPrice: Number(form.buyPrice), currentPrice: Number(form.currentPrice),
      quantity: Number(form.quantity), buyDate: form.buyDate, notes: form.notes,
    };
    if (editAsset) updateAsset(editAsset.id, data);
    else addAsset(data);
    setModalOpen(false);
    load();
  }

  function handleDelete() {
    if (deleteId) { deleteAsset(deleteId); setDeleteId(null); load(); }
  }

  function handleUpdatePrice(id: string) {
    if (!newPrice) return;
    updateAsset(id, { currentPrice: Number(newPrice) });
    setEditPriceId(null);
    setNewPrice('');
    load();
  }

  function setF(key: keyof AssetFormData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">📈 Portfolio Investasi</h2>
          <p className="text-slate-400 text-sm mt-0.5">Kelola dan pantau semua aset investasi Anda</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Tambah Aset</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">Total Nilai</p>
          <p className="text-white text-xl font-bold mt-1">{formatCurrency(totalValue)}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">Total Modal</p>
          <p className="text-white text-xl font-bold mt-1">{formatCurrency(totalCost)}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">Untung / Rugi</p>
          <p className={`text-xl font-bold mt-1 ${totalGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}</p>
        </div>
        <div className={`rounded-2xl p-4 border ${totalReturn >= 0 ? 'bg-emerald-900/30 border-emerald-700/40' : 'bg-red-900/30 border-red-700/40'}`}>
          <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">Return</p>
          <p className={`text-xl font-bold mt-1 ${totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%</p>
        </div>
      </div>

      {/* Chart + Asset list */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pie Chart */}
        {byType.length > 0 && (
          <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-slate-200 font-semibold mb-4">Alokasi Portfolio</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byType} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {byType.map((entry) => (
                    <Cell key={entry.type} fill={ASSET_COLORS[entry.type as AssetType]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Asset Table */}
        <div className={`${byType.length > 0 ? 'lg:col-span-3' : 'lg:col-span-5'} bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6`}>
          {/* Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[{ label: 'Semua', value: 'all' as const }, ...ASSET_TYPES.map(t => ({ label: `${ASSET_ICONS[t]} ${getAssetTypeLabel(t)}`, value: t }))].filter(f => f.value === 'all' || assets.some(a => a.type === f.value)).map(f => (
              <button key={f.value} onClick={() => setFilterType(f.value)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterType === f.value ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{f.label}</button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon="📈" title="Belum ada aset" description="Tambahkan aset investasi pertama Anda" action={<button onClick={openAdd} className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-500 transition-colors">+ Tambah Aset</button>} />
          ) : (
            <div className="space-y-3">
              {filtered.map(asset => {
                const value = asset.currentPrice * asset.quantity;
                const cost = asset.buyPrice * asset.quantity;
                const gl = value - cost;
                const glPct = cost > 0 ? (gl / cost) * 100 : 0;
                return (
                  <div key={asset.id} className="bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/40 rounded-xl p-4 transition-colors">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="text-2xl">{ASSET_ICONS[asset.type]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold">{asset.name}</span>
                          {asset.ticker && <span className="text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded-md font-mono">{asset.ticker}</span>}
                          <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-md">{getAssetTypeLabel(asset.type)}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm">
                          <span className="text-slate-400">Qty: <span className="text-slate-200 font-medium">{asset.quantity}</span></span>
                          <span className="text-slate-400">Beli: <span className="text-slate-200 font-medium">{formatCurrency(asset.buyPrice)}</span></span>
                          <span className="text-slate-400">Sekarang: {editPriceId === asset.id ? (
                            <span className="inline-flex items-center gap-1 ml-1">
                              <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-28 bg-slate-600 text-white text-sm rounded-lg px-2 py-0.5 border border-slate-500 focus:outline-none focus:border-emerald-500" placeholder={String(asset.currentPrice)} autoFocus />
                              <button onClick={() => handleUpdatePrice(asset.id)} className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold">✓</button>
                              <button onClick={() => setEditPriceId(null)} className="text-slate-500 hover:text-slate-400 text-xs">✕</button>
                            </span>
                          ) : (
                            <button onClick={() => { setEditPriceId(asset.id); setNewPrice(String(asset.currentPrice)); }} className="text-emerald-300 font-medium hover:underline">{formatCurrency(asset.currentPrice)}</button>
                          )}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{formatCurrency(value)}</p>
                        <p className={`text-sm font-semibold ${gl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{gl >= 0 ? '+' : ''}{formatCurrency(gl)} ({glPct >= 0 ? '+' : ''}{glPct.toFixed(1)}%)</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(asset)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors text-sm">✏️</button>
                        <button onClick={() => setDeleteId(asset.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-sm">🗑️</button>
                      </div>
                    </div>
                    {asset.notes && <p className="text-slate-500 text-xs mt-2 ml-9 italic">{asset.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editAsset ? '✏️ Edit Aset' : '+ Tambah Aset'} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nama Aset" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="cth. Bank BCA" required />
          <Input label="Ticker / Kode (opsional)" value={form.ticker} onChange={e => setF('ticker', e.target.value)} placeholder="cth. BBCA" />
          <Select label="Jenis Aset" value={form.type} onChange={e => setF('type', e.target.value)} options={ASSET_TYPES.map(t => ({ value: t, label: `${ASSET_ICONS[t]} ${getAssetTypeLabel(t)}` }))} required />
          <Input label="Jumlah / Lot / Unit" type="number" value={form.quantity} onChange={e => setF('quantity', e.target.value)} placeholder="0" required min="0" step="any" />
          <Input label="Harga Beli (per unit)" type="number" value={form.buyPrice} onChange={e => setF('buyPrice', e.target.value)} placeholder="0" required min="0" />
          <Input label="Harga Sekarang (per unit)" type="number" value={form.currentPrice} onChange={e => setF('currentPrice', e.target.value)} placeholder="0" required min="0" />
          <Input label="Tanggal Beli" type="date" value={form.buyDate} onChange={e => setF('buyDate', e.target.value)} required />
          <Input label="Catatan (opsional)" value={form.notes} onChange={e => setF('notes', e.target.value)} placeholder="Strategi, alasan beli, dll." />
          <div className="sm:col-span-2 flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Batal</Button>
            <Button type="submit" variant="primary" className="flex-1">{editAsset ? 'Simpan Perubahan' : 'Tambah Aset'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="🗑️ Hapus Aset" size="sm">
        <p className="text-slate-300 mb-6">Apakah Anda yakin ingin menghapus aset ini? Data tidak dapat dikembalikan.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)} className="flex-1">Batal</Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1">Ya, Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}
