'use client';

import React from 'react';
import { DashboardLayoutShell } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import { BarChart3, TrendingUp, Sparkles, FileText, Download } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function ReportsPage() {
  const milkEntries = useAppStore((state) => state.milkEntries);
  const expenses = useAppStore((state) => state.expenses);

  const totalQuantity = milkEntries.reduce((sum, e) => sum + e.quantity, 0);
  const totalRevenue = milkEntries.reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = expenses.reduce((sum, ex) => sum + ex.amount, 0);
  const netProfit = totalRevenue - totalExpense;

  return (
    <DashboardLayoutShell title="Reports & Analytics">
      <div className="space-y-6">
        
        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Total Revenue</p>
            <h3 className="text-xl font-bold">₹{totalRevenue.toFixed(1)}</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Total milk billing cycles</p>
          </Card>
          <Card className="border-l-4 border-l-rose-500">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Total Expenses</p>
            <h3 className="text-xl font-bold">₹{totalExpense.toFixed(1)}</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Feed, salary and veterinary logs</p>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Net Balance</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">₹{netProfit.toFixed(1)}</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Net operating revenue balance</p>
          </Card>
        </div>

        {/* Charts & actions section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card title="Milk Yield & Yield Analysis" subtitle="Overview yield metrics and total quantity log">
              <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-center items-center h-64 text-center">
                <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-500 dark:text-slate-400">Chart Visualization Mock</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                  Recharts implementation placeholder. Total volume tracked: {totalQuantity} L.
                </p>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card title="Quick Export Tools" subtitle="Download reports as Excel or PDF documents">
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3 rounded-xl py-3">
                  <FileText className="w-4.5 h-4.5 text-blue-600" />
                  <div className="text-left">
                    <p className="text-xs font-semibold">Monthly Yield Report</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Download Excel spread</p>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 rounded-xl py-3">
                  <FileText className="w-4.5 h-4.5 text-emerald-600" />
                  <div className="text-left">
                    <p className="text-xs font-semibold">Client Billing ledger</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Download PDF document</p>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 rounded-xl py-3">
                  <FileText className="w-4.5 h-4.5 text-rose-600" />
                  <div className="text-left">
                    <p className="text-xs font-semibold">Expenses Statements</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Download audit files</p>
                  </div>
                </Button>
              </div>
            </Card>
          </div>
        </div>

      </div>
    </DashboardLayoutShell>
  );
}
