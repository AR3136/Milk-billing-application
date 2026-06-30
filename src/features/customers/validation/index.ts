import { z } from 'zod';

export const customerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
  address: z.string().optional(),
  milkType: z.enum(['cow', 'buffalo', 'mixed']),
  defaultQuantity: z.number().positive('Default quantity must be greater than 0'),
  ratePerLiter: z.number().positive('Rate per liter must be greater than 0'),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().regex(/^[0-9]{10}$/, 'Emergency phone must be 10 digits').optional().or(z.literal('')),
  notes: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const customerFilterSchema = z.object({
  search: z.string().optional(),
  milkType: z.enum(['cow', 'buffalo', 'mixed', 'all']).optional(),
  status: z.enum(['active', 'archived', 'all']).optional(),
});
