import { z } from 'zod';

export const paymentFormSchema = z.object({
  customerId: z.string().uuid('Invalid customer selection'),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  paymentMethod: z.enum(['cash', 'upi', 'bank_transfer', 'cheque']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const refundFormSchema = z.object({
  customerId: z.string().uuid('Invalid customer selection'),
  amount: z.number().positive('Refund amount must be greater than 0'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
});
