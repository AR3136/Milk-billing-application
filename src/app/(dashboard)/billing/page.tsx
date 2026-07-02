'use client';

import React, { useState } from 'react';
import { DashboardLayoutShell } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import { Receipt, Eye, Calendar } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { BillInvoiceView } from '@/features/billing/components';
import { Bill } from '@/features/billing/types';

export default function BillingPage() {
  const customers = useAppStore((state) => state.customers);
  const milkEntries = useAppStore((state) => state.milkEntries);
  const payments = useAppStore((state) => state.payments);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Set default dates for the current billing cycle (current month)
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(new Date(y, now.getMonth() + 1, 0).getDate()).padStart(2, '0');
  
  const defaultFromDate = `${y}-${m}-01`;
  const defaultToDate = `${y}-${m}-${d}`;

  const [startDate, setStartDate] = useState(defaultFromDate);
  const [endDate, setEndDate] = useState(defaultToDate);

  const handleAction = (cust: any, idx: number) => {
    // 1. Calculate actual milk quantities logged for this customer in selected cycle
    const cycleEntries = milkEntries.filter(
      e => e.customerId === cust.id && e.date >= startDate && e.date <= endDate
    );

    const totalQuantity = cycleEntries.reduce((sum, e) => sum + e.quantity, 0);
    const cycleTotalAmount = cycleEntries.reduce((sum, e) => sum + e.amount, 0);

    // 2. Fetch payments made during this cycle
    const cyclePayments = payments
      .filter(p => p.customerId === cust.id && p.date >= startDate && p.date <= endDate)
      .reduce((sum, p) => sum + p.amount, 0);

    // 3. Compute net balance
    const balanceForward = Math.max(0, cust.balance - cycleTotalAmount + cyclePayments);
    const netPayable = cycleTotalAmount + balanceForward;

    const dynamicBill: Bill = {
      id: cust.id,
      bill_number: `INV-2026-00${idx + 1}`,
      customer_id: cust.id,
      customer_name: cust.name,
      from_date: startDate,
      to_date: endDate,
      total_quantity: totalQuantity,
      total_amount: cycleTotalAmount,
      paid_amount: cyclePayments,
      balance: cust.balance,
      balance_forward: balanceForward,
      net_payable: netPayable,
      status: cust.balance > 0 ? 'overdue' : 'paid',
      created_at: new Date().toISOString(),
    };

    setSelectedBill(dynamicBill);
  };

  const getFormattedRange = () => {
    try {
      const s = new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const e = new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      return `${s} - ${e}`;
    } catch {
      return `${startDate} - ${endDate}`;
    }
  };

  return (
    <DashboardLayoutShell title="Invoices & Billing">
      <div className="space-y-6">
        
        {/* Billing Cycle Range Controls */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Cycle Start Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Cycle End Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Active Cycle Period: <span className="font-bold text-blue-600 dark:text-blue-400">{getFormattedRange()}</span>
          </div>
        </div>

        {/* Invoice Grid */}
        <Card title="Active Billing Invoices" subtitle="Invoice cycles and current outstanding balances">
          <div className="relative">
            {/* Mobile swipe helper indicator */}
            <div className="block md:hidden text-center text-[10px] text-blue-500/80 dark:text-blue-400/80 mb-2 font-semibold animate-pulse">
              ← Swipe left/right to view table details →
            </div>
            <div className="overflow-x-auto w-full border border-slate-100 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Billing Range</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Dues Amount</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {customers.map((cust, idx) => (
                  <tr key={cust.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-500">#INV-2026-00{idx+1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{cust.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{getFormattedRange()}</td>
                    <td className="py-3.5 px-4">
                      {cust.balance > 0 ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-medium bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-md">
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
                          Settled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold">₹{cust.balance.toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex justify-center items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleAction(cust, idx)}
                          className="px-3 py-1 flex items-center gap-1 rounded-xl text-blue-600 border-blue-100 hover:bg-blue-50"
                          title="View Invoice"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Invoice
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
         </div>
        </Card>

        {/* Invoice Modal Overlay */}
        {selectedBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-1 print-area">
              <button 
                onClick={() => setSelectedBill(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold text-lg p-2 z-10 no-print"
                aria-label="Close Preview"
              >
                ✕
              </button>
              <div className="max-h-[90vh] overflow-y-auto">
                <BillInvoiceView bill={selectedBill} onClose={() => setSelectedBill(null)} />
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayoutShell>
  );
}
