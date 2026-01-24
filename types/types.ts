export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  date: string; // ISO date string
  createdAt: string; // ISO timestamp
  description?: string; // Optional description
  imageUri?: string; // Optional image URI
  category?: string; // Transaction category
}

export interface DailySummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

export interface TransactionFormData {
  title: string;
  amount: string;
  type: 'income' | 'expense';
  date: string;
  description: string;
  category: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

export type Tipe_WarnaTema = "sistem" | "dark" | "light";

export type Tipe_MataUang = "$" | "€" | "£" | "¥" | "Rp" | "₹" | "K";

export interface MataUang {
  symbol: Tipe_MataUang,
  name: string
}

export interface TipeBudget {
  budget: {
    [waktu: string]: BudgetLimit[]
  },
  default: {
    [category: string]: number
  }
}

export interface BudgetLimit {
  categoryId: string; // 'all' for overall monthly budget
  amount: number;
}