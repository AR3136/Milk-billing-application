import { createClient } from '@/lib/supabase/client';
import { Expense, ExpenseFormData } from '../types';

/**
 * Supabase client actions and report generators for business expenses
 */

// 1. Fetch expenses list
export async function getExpenses({
  category = 'all',
  fromDate = '',
  toDate = '',
}) {
  const supabase = createClient();
  let query = supabase
    .from('expenses')
    .select('*')
    .is('deleted_at', null);

  if (category !== 'all') {
    query = query.eq('category', category);
  }
  if (fromDate) {
    query = query.gte('date', fromDate);
  }
  if (toDate) {
    query = query.lte('date', toDate);
  }

  const { data, error } = await query.order('date', { ascending: false });
  if (error) throw error;
  return data as unknown as Expense[];
}

// 2. Log new expense record
export async function createExpense(data: ExpenseFormData) {
  const supabase = createClient();
  const { data: newExp, error } = await supabase
    .from('expenses')
    .insert([
      {
        category: data.category,
        description: data.description,
        amount: data.amount,
        date: data.date,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return newExp;
}

// 3. Delete expense
export async function deleteExpense(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// 4. Aggregate expenses by category for charts
export async function getExpenseSummaryByCategory({
  fromDate,
  toDate,
}: {
  fromDate: string;
  toDate: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .select('category, amount')
    .gte('date', fromDate)
    .lte('date', toDate)
    .is('deleted_at', null);

  if (error) throw error;

  const summary: Record<string, number> = {
    fuel: 0,
    salary: 0,
    electricity: 0,
    maintenance: 0,
    transport: 0,
    other: 0,
  };

  data?.forEach(ex => {
    if (summary[ex.category] !== undefined) {
      summary[ex.category] += Number(ex.amount);
    }
  });

  return Object.keys(summary).map(key => ({
    name: key,
    value: summary[key],
  }));
}
