import { z } from 'zod';

export const reportFilterSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly', 'customer']),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'From date must be in YYYY-MM-DD format'),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'To date must be in YYYY-MM-DD format'),
  customerId: z.string().uuid('Invalid customer selection').optional(),
});
