'use client';

import React from 'react';
import { Bell, Search, Sun, Moon, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title = 'Dairy Dashboard' }) => {
  const router = useRouter();
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  return (
    <header className="sticky-header h-16 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button 
          onClick={toggleSidebar}
          className="flex md:hidden p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl transition-all mr-1"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>
        <h1 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full bg-transparent border-none text-xs focus:outline-none dark:text-slate-200"
          />
        </div>

        <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl transition-all">
          <Bell className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400" />
        </button>

        <button 
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl transition-all"
        >
          {isDark ? (
            <Sun className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400" />
          )}
        </button>

        <button 
          onClick={handleLogout} 
          aria-label="Logout"
          className="p-2 hover:bg-rose-50 hover:text-rose-600 border border-slate-100 dark:border-slate-800 rounded-xl transition-all"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
};
