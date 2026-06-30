import { z } from 'zod';

export const expenseFormSchema = z.object({
  category: z.enum(['fuel', 'salary', 'electricity', 'maintenance', 'transport', 'other']),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  amount: z.number().positive('Expense amount must be greater than 0'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const expenseFilterSchema = z.object({
  category: z.enum(['fuel', 'salary', 'electricity', 'maintenance', 'transport', 'other', 'all']).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});
