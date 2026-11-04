import { TransactionCategory, AssetType } from '@/types';

/**
 * Classnames utility — merges class strings, filtering out falsy values.
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format a number as Indonesian Rupiah.
 * Example: 1500000 → "Rp 1.500.000"
 */
export function formatCurrency(amount: number): string {
  const formatted = Math.abs(amount)
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Format an ISO date string to Indonesian locale.
 * Example: "2026-11-05" → "5 Nov 2026"
 */
export function formatDate(date: string): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  const d = new Date(date);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format a YYYY-MM string to full Indonesian month name.
 * Example: "2026-11" → "November 2026"
 */
export function formatMonth(month: string): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const [year, m] = month.split('-');
  return `${months[parseInt(m, 10) - 1]} ${year}`;
}

/**
 * Get the start and end ISO date strings for a given YYYY-MM month.
 */
export function getMonthRange(month: string): { start: string; end: string } {
  const [year, m] = month.split('-').map(Number);
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 0); // last day of month
  const pad = (n: number) => n.toString().padStart(2, '0');
  return {
    start: `${year}-${pad(m)}-01`,
    end: `${year}-${pad(m)}-${pad(end.getDate())}`,
  };
}

/**
 * Calculate percentage, clamped between 0 and 100, safe for zero total.
 */
export function calculatePercentage(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
}

/**
 * Returns the current month in YYYY-MM format.
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Indonesian labels for transaction categories.
 */
const categoryLabels: Record<TransactionCategory, string> = {
  // Income
  salary: 'Gaji',
  freelance: 'Freelance',
  investment_return: 'Hasil Investasi',
  gift: 'Hadiah',
  other_income: 'Pendapatan Lain',
  // Expense
  food: 'Makanan & Minuman',
  transport: 'Transportasi',
  housing: 'Tempat Tinggal',
  utilities: 'Utilitas',
  entertainment: 'Hiburan',
  health: 'Kesehatan',
  education: 'Pendidikan',
  shopping: 'Belanja',
  insurance: 'Asuransi',
  debt_payment: 'Cicilan / Hutang',
  other_expense: 'Pengeluaran Lain',
};

export function getCategoryLabel(category: TransactionCategory): string {
  return categoryLabels[category] ?? category;
}

/**
 * Emoji icon per category.
 */
const categoryIcons: Record<TransactionCategory, string> = {
  salary: '💰',
  freelance: '💻',
  investment_return: '📈',
  gift: '🎁',
  other_income: '💵',
  food: '🍔',
  transport: '🚗',
  housing: '🏠',
  utilities: '💡',
  entertainment: '🎬',
  health: '🏥',
  education: '📚',
  shopping: '🛍️',
  insurance: '🛡️',
  debt_payment: '💳',
  other_expense: '📦',
};

export function getCategoryIcon(category: TransactionCategory): string {
  return categoryIcons[category] ?? '📌';
}

/**
 * Tailwind background-color class per category.
 */
const categoryColors: Record<TransactionCategory, string> = {
  salary: 'bg-emerald-500',
  freelance: 'bg-teal-500',
  investment_return: 'bg-green-500',
  gift: 'bg-pink-500',
  other_income: 'bg-lime-500',
  food: 'bg-orange-500',
  transport: 'bg-blue-500',
  housing: 'bg-violet-500',
  utilities: 'bg-yellow-500',
  entertainment: 'bg-rose-500',
  health: 'bg-red-500',
  education: 'bg-indigo-500',
  shopping: 'bg-fuchsia-500',
  insurance: 'bg-cyan-500',
  debt_payment: 'bg-amber-600',
  other_expense: 'bg-slate-500',
};

export function getCategoryColor(category: TransactionCategory): string {
  return categoryColors[category] ?? 'bg-gray-500';
}

/**
 * Indonesian labels for asset types.
 */
const assetTypeLabels: Record<AssetType, string> = {
  stock: 'Saham',
  crypto: 'Kripto',
  mutual_fund: 'Reksa Dana',
  bond: 'Obligasi',
  gold: 'Emas',
  deposit: 'Deposito',
  property: 'Properti',
  other: 'Lainnya',
};

export function getAssetTypeLabel(type: AssetType): string {
  return assetTypeLabels[type] ?? type;
}
