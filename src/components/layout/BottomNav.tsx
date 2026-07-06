'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Milk, 
  Receipt, 
  Settings,
  Clock as HistoryIcon
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const primaryItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Milk Entry', path: '/milk-entry', icon: Milk, exact: true },
    { name: 'Bulk History', path: '/milk-entry/bulk-historical', icon: HistoryIcon },
    { name: 'Billing', path: '/billing', icon: Receipt },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav suppressHydrationWarning className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-40 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      {primaryItems.map((item) => {
        const Icon = item.icon;
        const normalizedPathname = (pathname || '').replace(/\/$/, '');
        const isActive = item.exact
          ? normalizedPathname === item.path
          : (normalizedPathname === item.path || normalizedPathname.startsWith(item.path + '/'));
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-200 ${
              isActive 
                ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Icon className="w-5.5 h-5.5" />
            <span className="text-[10px] mt-1">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};
