'use client';

import React, { useState, useMemo } from 'react';
import { DashboardLayoutShell } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import { Receipt, Eye, Calendar, Search } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { BillInvoiceView } from '@/features/billing/components';
import { Bill } from '@/features/billing/types';

export default function BillingPage() {
  const customers = useAppStore((state) => state.customers);
  const milkEntries = useAppStore((state) => state.milkEntries);
  const payments = useAppStore((state) => state.payments);
  const expenses = useAppStore((state) => state.expenses);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [searchQuery, setSearchQuery]   = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
    );
  }, [customers, searchQuery]);

  // Set default dates for the current billing cycle (current month)
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(new Date(y, now.getMonth() + 1, 0).getDate()).padStart(2, '0');
  
  const defaultFromDate = `${y}-${m}-01`;
  const defaultToDate = `${y}-${m}-${d}`;

  const [startDate, setStartDate] = useState(defaultFromDate);
  const [endDate, setEndDate] = useState(defaultToDate);

  const computeBillingInfo = (cust: any) => {
    // 1. Calculate actual milk quantities logged for this customer in selected cycle
    const cycleEntries = milkEntries.filter(
      e => e.customerId === cust.id && e.date >= startDate && e.date <= endDate
    );

    const totalQuantity = cycleEntries.reduce((sum, e) => sum + e.quantity, 0);
    
    // Calculate total yield: simple rate * qty for each type, rounded
    const cowEntries = cycleEntries.filter(e => e.milkType === 'cow');
    const buffaloEntries = cycleEntries.filter(e => e.milkType === 'buffalo');
    const mixedEntries = cycleEntries.filter(e => e.milkType !== 'cow' && e.milkType !== 'buffalo');

    const cowQty = cowEntries.reduce((sum, e) => sum + e.quantity, 0);
    const cowRate = cowEntries.find(e => e.rate > 0)?.rate || cust.rateCow || cust.rate || 0;
    const cowAmt = Math.round(cowQty * cowRate);

    const buffaloQty = buffaloEntries.reduce((sum, e) => sum + e.quantity, 0);
    const buffaloRate = buffaloEntries.find(e => e.rate > 0)?.rate || cust.rateBuffalo || cust.rate || 0;
    const buffaloAmt = Math.round(buffaloQty * buffaloRate);

    const mixedQty = mixedEntries.reduce((sum, e) => sum + e.quantity, 0);
    const mixedRate = mixedEntries.find(e => e.rate > 0)?.rate || cust.rate || 0;
    const mixedAmt = Math.round(mixedQty * mixedRate);

    const cycleTotalAmount = cowAmt + buffaloAmt + mixedAmt;

    // 2. Fetch payments made during this cycle, deducting credit settlements
    const cyclePaymentsRaw = payments
      .filter(p => p.customerId === cust.id && p.date >= startDate && p.date <= endDate)
      .reduce((sum, p) => sum + p.amount, 0);
    const cycleSettlements = expenses
      .filter(ex => ex.category === 'customer_credit_settlement' && ex.customerId === cust.id && ex.date >= startDate && ex.date <= endDate)
      .reduce((sum, ex) => sum + ex.amount, 0);
    const cyclePayments = cyclePaymentsRaw - cycleSettlements;

    // 3. Compute balance forward (dues before cycle start date)
    const priorEntries = milkEntries.filter(e => e.customerId === cust.id && e.date < startDate);
    const priorCow = priorEntries.filter(e => e.milkType === 'cow');
    const priorBuffalo = priorEntries.filter(e => e.milkType === 'buffalo');
    const priorMixed = priorEntries.filter(e => e.milkType !== 'cow' && e.milkType !== 'buffalo');

    const priorCowQty = priorCow.reduce((sum, e) => sum + e.quantity, 0);
    const priorCowRate = priorCow.find(e => e.rate > 0)?.rate || cust.rateCow || cust.rate || 0;
    const priorCowAmt = Math.round(priorCowQty * priorCowRate);

    const priorBuffaloQty = priorBuffalo.reduce((sum, e) => sum + e.quantity, 0);
    const priorBuffaloRate = priorBuffalo.find(e => e.rate > 0)?.rate || cust.rateBuffalo || cust.rate || 0;
    const priorBuffaloAmt = Math.round(priorBuffaloQty * priorBuffaloRate);

    const priorMixedQty = priorMixed.reduce((sum, e) => sum + e.quantity, 0);
    const priorMixedRate = priorMixed.find(e => e.rate > 0)?.rate || cust.rate || 0;
    const priorMixedAmt = Math.round(priorMixedQty * priorMixedRate);

    const priorMilk = priorCowAmt + priorBuffaloAmt + priorMixedAmt;

    const priorPayments = payments.filter(p => p.customerId === cust.id && p.date < startDate);
    const priorPaidRaw = priorPayments.reduce((sum, p) => sum + p.amount, 0);
    const priorSettlements = expenses.filter(ex => ex.category === 'customer_credit_settlement' && ex.customerId === cust.id && ex.date < startDate);
    const priorSettled = priorSettlements.reduce((sum, ex) => sum + ex.amount, 0);
    const priorPaid = priorPaidRaw - priorSettled;

    const rawBalanceForward = priorMilk - priorPaid;
    const balanceForward = Math.abs(rawBalanceForward) < 0.01 ? 0 : parseFloat(rawBalanceForward.toFixed(2));
    const netPayable = Math.round(Math.max(0, cycleTotalAmount + balanceForward - cyclePayments));

    return {
      totalQuantity,
      cycleTotalAmount,
      cyclePayments,
      balanceForward,
      netPayable,
    };
  };

  const handleAction = (cust: any, idx: number) => {
    const info = computeBillingInfo(cust);

    const dynamicBill: Bill = {
      id: cust.id,
      bill_number: `INV-2026-00${idx + 1}`,
      customer_id: cust.id,
      customer_name: cust.name,
      from_date: startDate,
      to_date: endDate,
      total_quantity: info.totalQuantity,
      total_amount: info.cycleTotalAmount,
      paid_amount: info.cyclePayments,
      balance: cust.balance,
      balance_forward: info.balanceForward,
      net_payable: info.netPayable,
      status: info.netPayable > 0 ? 'overdue' : 'paid',
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
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search client by name or phone..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto w-full border border-slate-100 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <th className="py-3.5 px-5">Client Name</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Dues Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((cust, idx) => {
                    const billInfo = computeBillingInfo(cust);
                    return (
                      <tr 
                        key={cust.id} 
                        onClick={() => handleAction(cust, idx)}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-5 font-bold text-slate-850 dark:text-slate-200">
                          {cust.name}
                        </td>
                        <td className="py-4 px-5">
                          {billInfo.netPayable > 0.01 ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-medium bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-md text-[10px]">
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md text-[10px]">
                              Settled
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right font-black text-slate-800 dark:text-slate-100">
                          ₹{billInfo.netPayable.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      No clients match your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
