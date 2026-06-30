import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getExpenses, createExpense, deleteExpense, getExpenseSummaryByCategory } from '../services';
import { Expense, ExpenseFormData } from '../types';

/**
 * Custom hook to retrieve expenses list and category totals
 */
export function useExpensesSummary(params: { fromDate: string; toDate: string; category?: string }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, chartRes] = await Promise.all([
        getExpenses({
          category: params.category || 'all',
          fromDate: params.fromDate,
          toDate: params.toDate,
        }),
        getExpenseSummaryByCategory({
          fromDate: params.fromDate,
          toDate: params.toDate,
        }),
      ]);
      setExpenses(listRes);
      setChartData(chartRes);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load expense summaries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [params.fromDate, params.toDate, params.category]);

  return {
    expenses,
    chartData,
    loading,
    error,
    refresh: fetchSummary,
  };
}

/**
 * Custom hooks to handle creation and deletion of expenses
 */
export function useExpenseActions() {
  const [isMutating, setIsMutating] = useState(false);

  const performAction = async (action: () => Promise<any>, successMsg: string) => {
    setIsMutating(true);
    try {
      const res = await action();
      toast.success(successMsg);
      return res;
    } catch (err: any) {
      toast.error(err.message || 'Operation failed.');
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  return {
    isMutating,
    createExpense: (data: ExpenseFormData) =>
      performAction(() => createExpense(data), 'Expense logged successfully.'),
    deleteExpense: (id: string) =>
      performAction(() => deleteExpense(id), 'Expense record deleted.'),
  };
}
