import { z } from 'zod';

export const settingsFormSchema = z.object({
  businessName: z.string().min(2, 'Business Name must be at least 2 characters'),
  businessPhone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
  businessAddress: z.string().min(5, 'Address is too short'),
  defaultCowRate: z.number().positive('Rate must be positive'),
  defaultBuffaloRate: z.number().positive('Rate must be positive'),
  upiId: z.string().regex(/^[\w.-]+@[\w.-]+$/, 'Invalid UPI ID format (e.g. name@bank)').optional().or(z.literal('')),
  invoiceTemplate: z.enum(['simple', 'detailed', 'compact']),
  language: z.enum(['en', 'hi', 'mr']),
  theme: z.enum(['light', 'dark', 'system']),
  enableSms: z.boolean(),
  enableWhatsapp: z.boolean(),
});
