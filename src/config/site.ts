// Site-wide configuration and metadata

export const siteConfig = {
  name: 'Milk Billing System',
  description: 'Professional milk billing and customer management system',
  version: '1.0.0',
  author: 'Milk Billing System',
} as const;

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string;
  disabled?: boolean;
}

export const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { title: 'Customers', href: '/customers', icon: 'Users' },
  { title: 'Milk Entry', href: '/milk-entry', icon: 'Milk' },
  { title: 'Billing', href: '/billing', icon: 'Receipt' },
  { title: 'Payments', href: '/payments', icon: 'CreditCard' },
  { title: 'Reports', href: '/reports', icon: 'BarChart3' },
  { title: 'Expenses', href: '/expenses', icon: 'Wallet' },
  { title: 'Settings', href: '/settings', icon: 'Settings' },
  { title: 'Admin', href: '/admin', icon: 'Shield' },
];
