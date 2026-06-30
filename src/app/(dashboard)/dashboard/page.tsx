'use client';

import React from 'react';
import { DashboardLayoutShell } from '@/components/layout';
import { StatCard } from '@/components/common';
import { Card, Badge, Button } from '@/components/ui';
import { Milk, Users, ArrowUpRight, TrendingUp, AlertCircle, Sparkles, Receipt, CreditCard, Wallet } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import Link from 'next/link';

export default function DashboardPage() {
  const customers = useAppStore((state) => state.customers);
  const milkEntries = useAppStore((state) => state.milkEntries);
  const payments = useAppStore((state) => state.payments);
  const currentUser = useAppStore((state) => state.currentUser);

  const today = new Date().toISOString().split('T')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const activeCustomers = customers.filter(c => c.isActive).length;
  const totalMilkToday = milkEntries
    .filter(e => e.date === today)
    .reduce((sum, e) => sum + e.quantity, 0);

  const pendingDues = customers
    .filter(c => c.balance > 0)
    .reduce((sum, c) => sum + c.balance, 0);

  return (
    <DashboardLayoutShell title="Overview Dashboard">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-2xl text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              {greeting}, {currentUser?.name?.split(' ')[0] || 'Welcome'}! <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300" />
            </h2>
            <p className="text-xs md:text-sm text-blue-50">Here is the quick snapshot of your milk collections and billings today.</p>
          </div>
          <Badge variant="secondary" className="bg-emerald-400/20 text-white border-none py-1 px-3">
            {today}
          </Badge>
        </div>

        {/* Quick Access Portal (Just above dashboard stats) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Row 1: Customers & Billing */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/customers" className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">Customers</h4>
                <p className="text-[9px] text-slate-500 truncate">Manage members</p>
              </div>
            </Link>
            <Link href="/billing" className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">Billing</h4>
                <p className="text-[9px] text-slate-500 truncate">Invoices & cycles</p>
              </div>
            </Link>
          </div>
          
          {/* Row 2: Payments & Expenses */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/payments" className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-violet-500/50 transition-all shadow-sm hover:shadow-md">
              <div className="w-10 h-10 bg-violet-500/10 text-violet-500 rounded-xl flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">Payments</h4>
                <p className="text-[9px] text-slate-500 truncate">Collect dues & cash</p>
              </div>
            </Link>
            <Link href="/expenses" className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-amber-500/50 transition-all shadow-sm hover:shadow-md">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">Expenses</h4>
                <p className="text-[9px] text-slate-500 truncate">Track feed & transport</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Active Customers" 
            value={activeCustomers} 
            subValue="Register & Delivering"
            icon={<Users className="w-5 h-5 text-blue-500" />}
            trend={{ type: 'up', value: '+4%' }}
            color="blue"
          />
          <StatCard 
            title="Today Milk" 
            value={`${totalMilkToday} Liters`} 
            subValue="Shift: Morning"
            icon={<Milk className="w-5 h-5 text-emerald-500" />}
            trend={{ type: 'up', value: '+12%' }}
            color="green"
          />
          <StatCard 
            title="Pending Dues" 
            value={`₹${pendingDues}`} 
            subValue="Unpaid Bills"
            icon={<AlertCircle className="w-5 h-5 text-rose-500" />}
            trend={{ type: 'down', value: '-2.5%' }}
            color="rose"
          />
          <StatCard 
            title="Collection Rate" 
            value="94.2%" 
            subValue="Monthly Average"
            icon={<TrendingUp className="w-5 h-5 text-amber-500" />}
            trend={{ type: 'neutral', value: 'Stable' }}
            color="amber"
          />
        </div>

        {/* Main Content Spliter */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Deliveries */}
          <div className="lg:col-span-2 space-y-4">
            <Card title="Today's Milk Collections" subtitle="Real-time collection logging tracker">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Shift</th>
                      <th className="py-3 px-4">Milk Type</th>
                      <th className="py-3 px-4">Qty (L)</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {milkEntries.slice(0, 4).map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-200">{entry.customerName}</td>
                        <td className="py-3.5 px-4">
                          <Badge variant={entry.shift === 'morning' ? 'primary' : 'warning'}>
                            {entry.shift}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 uppercase text-slate-500">{entry.milkType || 'cow'}</td>
                        <td className="py-3.5 px-4 font-medium">{entry.quantity} L</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-800 dark:text-slate-100">₹{entry.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Quick Actions Panel */}
          <div className="space-y-4">
            <Card title="Recent Transactions" subtitle="Payment payouts & collections history">
              <div className="space-y-3">
                {payments.slice(0, 3).map((pay) => (
                  <div key={pay.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl hover:translate-x-1 duration-200">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{pay.customerName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{pay.method} • {pay.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+₹{pay.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayoutShell>
  );
}
