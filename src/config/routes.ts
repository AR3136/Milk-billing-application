// Route constants for type-safe navigation

export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // Dashboard
  DASHBOARD: '/dashboard',

  // Customers
  CUSTOMERS: '/customers',
  CUSTOMER_DETAIL: (id: string) => `/customers/${id}` as const,

  // Milk Entry
  MILK_ENTRY: '/milk-entry',

  // Billing
  BILLING: '/billing',
  BILL_DETAIL: (id: string) => `/billing/${id}` as const,

  // Payments
  PAYMENTS: '/payments',

  // Reports
  REPORTS: '/reports',

  // Expenses
  EXPENSES: '/expenses',

  // Settings
  SETTINGS: '/settings',

  // Admin
  ADMIN: '/admin',
} as const;
