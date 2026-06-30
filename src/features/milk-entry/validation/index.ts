import { z } from 'zod';

export const milkEntrySchema = z.object({
  customerId: z.string().uuid('Invalid customer selection'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  shift: z.enum(['morning', 'evening']),
  quantity: z.number().positive('Quantity must be greater than 0'),
  fat: z.number().min(0, 'Fat cannot be negative').max(15, 'Fat limit exceeded').optional(),
  snf: z.number().min(0, 'SNF cannot be negative').max(12, 'SNF limit exceeded').optional(),
  rate: z.number().positive('Rate must be positive'),
  remarks: z.string().optional(),
});

export const milkEntryFilterSchema = z.object({
  date: z.string().optional(),
  shift: z.enum(['morning', 'evening', 'all']).optional(),
  customerId: z.string().optional(),
});
