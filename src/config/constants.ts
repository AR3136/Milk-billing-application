// Application constants

export const MILK_TYPES = ['cow', 'buffalo', 'mixed'] as const;
export type MilkType = (typeof MILK_TYPES)[number];

export const SHIFTS = ['morning', 'evening'] as const;
export type Shift = (typeof SHIFTS)[number];

export const PAYMENT_METHODS = ['cash', 'upi', 'bank_transfer', 'cheque'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const BILL_STATUSES = ['draft', 'generated', 'sent', 'paid', 'overdue'] as const;
export type BillStatus = (typeof BILL_STATUSES)[number];

export const USER_ROLES = ['admin', 'manager', 'operator'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const EXPENSE_CATEGORIES = [
  'feed', 'transport', 'equipment', 'salary', 'maintenance', 'veterinary', 'other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const BILLING_CYCLES = ['weekly', 'biweekly', 'monthly'] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
