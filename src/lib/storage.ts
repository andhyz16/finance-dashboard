import {
  Transaction,
  TransactionType,
  TransactionCategory,
  MonthlyBudget,
  BudgetCategory,
  SavingsGoal,
  PortfolioAsset,
  FinancialSummary,
} from '@/types';
import { getMonthRange, getCurrentMonth } from '@/lib/utils';

// ─── localStorage key prefix ────────────────────────────────────────────────
const PREFIX = 'fin_';

const KEYS = {
  transactions: `${PREFIX}transactions`,
  budgets: `${PREFIX}budgets`, // stored as Record<month, MonthlyBudget>
  savingsGoals: `${PREFIX}savings_goals`,
  portfolio: `${PREFIX}portfolio`,
} as const;

// ─── UUID helper ────────────────────────────────────────────────────────────
export function generateId(): string {
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).substring(2, 9)
  );
}

// ─── Generic CRUD helpers ───────────────────────────────────────────────────

export function getData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Transactions ───────────────────────────────────────────────────────────

export function getTransactions(): Transaction[] {
  return getData<Transaction[]>(KEYS.transactions) ?? [];
}

export function addTransaction(
  tx: Omit<Transaction, 'id' | 'createdAt'>
): Transaction {
  const transactions = getTransactions();
  const newTx: Transaction = {
    ...tx,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  transactions.unshift(newTx);
  saveData(KEYS.transactions, transactions);
  return newTx;
}

export function updateTransaction(
  id: string,
  updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>
): Transaction | null {
  const transactions = getTransactions();
  const idx = transactions.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  transactions[idx] = { ...transactions[idx], ...updates };
  saveData(KEYS.transactions, transactions);
  return transactions[idx];
}

export function deleteTransaction(id: string): boolean {
  const transactions = getTransactions();
  const filtered = transactions.filter((t) => t.id !== id);
  if (filtered.length === transactions.length) return false;
  saveData(KEYS.transactions, filtered);
  return true;
}

/**
 * Get transactions filtered by month (YYYY-MM) and optional type.
 */
export function getTransactionsByMonth(
  month: string,
  type?: TransactionType
): Transaction[] {
  const { start, end } = getMonthRange(month);
  return getTransactions().filter((t) => {
    const dateMatch = t.date >= start && t.date <= end;
    const typeMatch = type ? t.type === type : true;
    return dateMatch && typeMatch;
  });
}

// ─── Budgets ────────────────────────────────────────────────────────────────

type BudgetStore = Record<string, MonthlyBudget>;

function getBudgetStore(): BudgetStore {
  return getData<BudgetStore>(KEYS.budgets) ?? {};
}

export function getBudget(month: string): MonthlyBudget | null {
  const store = getBudgetStore();
  const budget = store[month] ?? null;

  if (!budget) return null;

  // Recalculate spent amounts from actual transactions
  const expenses = getTransactionsByMonth(month, 'expense');
  const spentMap: Record<string, number> = {};
  for (const tx of expenses) {
    spentMap[tx.category] = (spentMap[tx.category] ?? 0) + tx.amount;
  }

  const updatedCategories = budget.categories.map((bc) => ({
    ...bc,
    spent: spentMap[bc.category] ?? 0,
  }));

  return { ...budget, categories: updatedCategories };
}

export function saveBudget(month: string, budget: MonthlyBudget): void {
  const store = getBudgetStore();
  store[month] = { ...budget, month };
  saveData(KEYS.budgets, store);
}

/**
 * Create or update a single category budget for a given month.
 */
export function setBudgetCategory(
  month: string,
  category: TransactionCategory,
  limit: number
): MonthlyBudget {
  const existing = getBudget(month) ?? {
    month,
    categories: [],
    totalBudget: 0,
  };

  const idx = existing.categories.findIndex((c) => c.category === category);
  if (idx >= 0) {
    existing.categories[idx].limit = limit;
  } else {
    existing.categories.push({ category, limit, spent: 0 });
  }

  existing.totalBudget = existing.categories.reduce(
    (sum, c) => sum + c.limit,
    0
  );

  saveBudget(month, existing);
  return existing;
}

// ─── Savings Goals ──────────────────────────────────────────────────────────

export function getSavingsGoals(): SavingsGoal[] {
  return getData<SavingsGoal[]>(KEYS.savingsGoals) ?? [];
}

export function addSavingsGoal(
  goal: Omit<SavingsGoal, 'id' | 'createdAt'>
): SavingsGoal {
  const goals = getSavingsGoals();
  const newGoal: SavingsGoal = {
    ...goal,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  goals.push(newGoal);
  saveData(KEYS.savingsGoals, goals);
  return newGoal;
}

export function updateSavingsGoal(
  id: string,
  updates: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>
): SavingsGoal | null {
  const goals = getSavingsGoals();
  const idx = goals.findIndex((g) => g.id === id);
  if (idx === -1) return null;
  goals[idx] = { ...goals[idx], ...updates };
  saveData(KEYS.savingsGoals, goals);
  return goals[idx];
}

export function deleteSavingsGoal(id: string): boolean {
  const goals = getSavingsGoals();
  const filtered = goals.filter((g) => g.id !== id);
  if (filtered.length === goals.length) return false;
  saveData(KEYS.savingsGoals, filtered);
  return true;
}

export function addToSavingsGoal(id: string, amount: number): SavingsGoal | null {
  const goals = getSavingsGoals();
  const idx = goals.findIndex((g) => g.id === id);
  if (idx === -1) return null;
  goals[idx].currentAmount = Math.max(0, goals[idx].currentAmount + amount);
  saveData(KEYS.savingsGoals, goals);
  return goals[idx];
}

// ─── Portfolio ──────────────────────────────────────────────────────────────

export function getPortfolio(): PortfolioAsset[] {
  return getData<PortfolioAsset[]>(KEYS.portfolio) ?? [];
}

export function addAsset(
  asset: Omit<PortfolioAsset, 'id'>
): PortfolioAsset {
  const portfolio = getPortfolio();
  const newAsset: PortfolioAsset = {
    ...asset,
    id: generateId(),
  };
  portfolio.push(newAsset);
  saveData(KEYS.portfolio, portfolio);
  return newAsset;
}

export function updateAsset(
  id: string,
  updates: Partial<Omit<PortfolioAsset, 'id'>>
): PortfolioAsset | null {
  const portfolio = getPortfolio();
  const idx = portfolio.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  portfolio[idx] = { ...portfolio[idx], ...updates };
  saveData(KEYS.portfolio, portfolio);
  return portfolio[idx];
}

export function deleteAsset(id: string): boolean {
  const portfolio = getPortfolio();
  const filtered = portfolio.filter((a) => a.id !== id);
  if (filtered.length === portfolio.length) return false;
  saveData(KEYS.portfolio, filtered);
  return true;
}

// ─── Financial Summary ──────────────────────────────────────────────────────

/**
 * Calculate a full financial summary for the given month (defaults to current).
 */
export function getFinancialSummary(
  month?: string
): FinancialSummary {
  const targetMonth = month ?? getCurrentMonth();

  // Income & expenses for the month
  const incomes = getTransactionsByMonth(targetMonth, 'income');
  const expenses = getTransactionsByMonth(targetMonth, 'expense');

  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0
    ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
    : 0;

  // Portfolio
  const portfolio = getPortfolio();
  const portfolioValue = portfolio.reduce(
    (sum, a) => sum + a.currentPrice * a.quantity,
    0
  );
  const portfolioCost = portfolio.reduce(
    (sum, a) => sum + a.buyPrice * a.quantity,
    0
  );
  const portfolioGainLoss = portfolioValue - portfolioCost;

  // Savings goals total
  const savingsTotal = getSavingsGoals().reduce(
    (sum, g) => sum + g.currentAmount,
    0
  );

  // Simple net worth = portfolio + savings + monthly balance
  const netWorth = portfolioValue + savingsTotal + balance;

  return {
    totalIncome,
    totalExpense,
    balance,
    savingsRate,
    netWorth,
    portfolioValue,
    portfolioGainLoss,
  };
}
