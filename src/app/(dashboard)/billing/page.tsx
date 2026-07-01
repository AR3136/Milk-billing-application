'use client';

import React, { useState } from 'react';
import { DashboardLayoutShell } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import { Receipt, Eye } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { BillInvoiceView } from '@/features/billing/components';
import { Bill } from '@/features/billing/types';

export default function BillingPage() {
  const customers = useAppStore((state) => state.customers);
  const milkEntries = useAppStore((state) => state.milkEntries);
  const payments = useAppStore((state) => state.payments);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);


  const handleAction = (cust: any, idx: number) => {
    // Get all entries for this customer to find the earliest logged milk entry
    const custEntries = milkEntries.filter(e => e.customerId === cust.id);
    const sortedEntries = [...custEntries].sort((a, b) => a.date.localeCompare(b.date));

    // Billing Cycle: From the day of the first entry to today
    const fromDate = sortedEntries.length > 0 ? sortedEntries[0].date : '2026-06-16';
    const toDate = new Date().toISOString().split('T')[0];

    const cycleEntries = milkEntries.filter(
      e => e.customerId === cust.id && e.date >= fromDate && e.date <= toDate
    );

    const totalQuantity = cycleEntries.reduce((sum, e) => sum + e.quantity, 0);
    const cycleTotalAmount = cycleEntries.reduce((sum, e) => sum + e.amount, 0);

    // Fetch payments made during this cycle
    const cyclePayments = payments
      .filter(p => p.customerId === cust.id && p.date >= fromDate && p.date <= toDate)
      .reduce((sum, p) => sum + p.amount, 0);

    // Compute net balance
    const balanceForward = Math.max(0, cust.balance - cycleTotalAmount + cyclePayments);
    const netPayable = cycleTotalAmount + balanceForward;

    const dynamicBill: Bill = {
      id: cust.id,
      bill_number: `INV-2026-00${idx + 1}`,
      customer_id: cust.id,
      customer_name: cust.name,
      from_date: fromDate,
      to_date: toDate,
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

  return (
    <DashboardLayoutShell title="Invoices & Billing">
      <div className="space-y-6">
        
        {/* Billing Overview header */}
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Cycle Billings</h2>
            <p className="text-xs text-slate-500">Generate cycle invoices for delivered milk units</p>
          </div>
        </div>

        {/* Invoice Grid */}
        <Card title="Active Billing Invoices" subtitle="Invoice cycles and current outstanding balances">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
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
                    <td className="py-3.5 px-4 text-slate-500">Jun 16 - Jun 30, 2026</td>
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
