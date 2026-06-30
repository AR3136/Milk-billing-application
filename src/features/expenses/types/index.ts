// Expenses feature types
export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  receipt_url?: string;
  created_by: string;
  created_at: string;
}

export type ExpenseCategory =
  | 'feed'
  | 'transport'
  | 'equipment'
  | 'salary'
  | 'maintenance'
  | 'veterinary'
  | 'other';

export interface ExpenseFormData {
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  receipt_url?: string;
}

export interface ExpenseFilters {
  category?: ExpenseCategory;
  from_date?: string;
  to_date?: string;
}
