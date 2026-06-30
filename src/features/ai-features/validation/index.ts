import { z } from 'zod';

export const aiPredictionQuerySchema = z.object({
  target: z.enum(['milk_yield', 'revenue', 'expenses', 'payment_risk']),
  customerId: z.string().uuid('Invalid customer selection').optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});
