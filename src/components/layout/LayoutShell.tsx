'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { useAppStore } from '@/lib/store';

interface LayoutShellProps {
  children: React.ReactNode;
  title?: string;
}

export const DashboardLayoutShell: React.FC<LayoutShellProps> = ({ children, title }) => {
  const router = useRouter();
  const fetchData = useAppStore((state) => state.fetchData);
  const loadCurrentUser = useAppStore((state) => state.loadCurrentUser);
  const isLoading = useAppStore((state) => state.isLoading);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const init = async () => {
      const user = await loadCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      await fetchData();
      setBooting(false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 pb-24 md:pb-8">
          {booting || isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading your data...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default DashboardLayoutShell;
