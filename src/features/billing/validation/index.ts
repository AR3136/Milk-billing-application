import { z } from 'zod';

export const billGenerateSchema = z.object({
  customerId: z.string().uuid('Invalid customer selection'),
  cycleType: z.enum(['weekly', 'biweekly', 'monthly', 'custom']),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'From date must be in YYYY-MM-DD format'),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'To date must be in YYYY-MM-DD format'),
});

export const billFilterSchema = z.object({
  status: z.enum(['draft', 'generated', 'sent', 'paid', 'overdue', 'all']).optional(),
  customerId: z.string().optional(),
});
