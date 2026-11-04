// Transaction types
export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  // Income categories
  | 'salary'
  | 'freelance'
  | 'investment_return'
  | 'gift'
  | 'other_income'
  // Expense categories
  | 'food'
  | 'transport'
  | 'housing'
  | 'utilities'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'shopping'
  | 'insurance'
  | 'debt_payment'
  | 'other_expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  date: string; // ISO date string
  createdAt: string;
}

// Budget types
export interface BudgetCategory {
  category: TransactionCategory;
  limit: number;
  spent: number;
}

export interface MonthlyBudget {
  month: string; // YYYY-MM format
  categories: BudgetCategory[];
  totalBudget: number;
}

// Savings Goal types
export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
  icon: string;
  createdAt: string;
}

// Portfolio types
export type AssetType =
  | 'stock'
  | 'crypto'
  | 'mutual_fund'
  | 'bond'
  | 'gold'
  | 'deposit'
  | 'property'
  | 'other';

export interface PortfolioAsset {
  id: string;
  name: string;
  ticker?: string;
  type: AssetType;
  buyPrice: number;
  currentPrice: number;
  quantity: number;
  buyDate: string;
  notes?: string;
}

// Net Worth types
export interface NetWorthEntry {
  id: string;
  month: string; // YYYY-MM
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

// Dashboard summary
export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
  netWorth: number;
  portfolioValue: number;
  portfolioGainLoss: number;
}
