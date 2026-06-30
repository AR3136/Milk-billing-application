'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayoutShell } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { CreditCard, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export default function PaymentsPage() {
  const customers = useAppStore((state) => state.customers);
  const payments = useAppStore((state) => state.payments);
  const addPayment = useAppStore((state) => state.addPayment);

  const today = new Date().toISOString().split('T')[0];
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [method, setMethod] = useState<'cash' | 'upi' | 'bank_transfer'>('upi');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !amount) {
      toast.error('Please select a customer and enter an amount.');
      return;
    }
    const selectedCust = customers.find(c => c.id === customerId);
    if (!selectedCust) return;

    setIsSaving(true);
    try {
      await addPayment({
        customerId,
        customerName: selectedCust.name,
        amount: Number(amount),
        date,
        method,
      });
      toast.success(`✓ Payment of ₹${amount} recorded for ${selectedCust.name}`);
      setAmount('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save payment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayoutShell title="Payments Logbook">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Record payment form */}
        <div>
          <Card title="Collect Payment" subtitle="Record a customer payment">
            {customers.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <AlertCircle className="w-8 h-8 text-amber-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No customers yet.<br />
                  <span className="font-semibold text-blue-600">Add a customer first.</span>
                </p>
              </div>
            ) : (
              <form onSubmit={handlePay} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Customer</label>
                  <select
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                    value={customerId}
                    onChange={e => setCustomerId(e.target.value)}
                    disabled={isSaving}
                    required
                  >
                    <option value="">— Select customer —</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} — Due: ₹{c.balance.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Amount (₹)"
                  type="number"
                  min="1"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  disabled={isSaving}
                />

                <Input
                  label="Payment Date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  disabled={isSaving}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Payment Method</label>
                  <select
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                    value={method}
                    onChange={e => setMethod(e.target.value as any)}
                    disabled={isSaving}
                  >
                    <option value="upi">UPI / GPay</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <Button type="submit" className="w-full gap-2 mt-2" disabled={isSaving || !customerId}>
                  <CreditCard className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Record Payment'}
                </Button>
              </form>
            )}
          </Card>
        </div>

        {/* Payments history */}
        <div className="lg:col-span-2">
          <Card title="Payment History" subtitle={`${payments.length} payment${payments.length !== 1 ? 's' : ''} recorded`}>
            {payments.length === 0 ? (
              <div className="py-12 text-center">
                <CreditCard className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">No payments recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {payments.slice(0, 50).map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{p.date}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{p.customerName}</td>
                        <td className="py-3.5 px-4 capitalize text-slate-500 dark:text-slate-400">{p.method.replace('_', ' ')}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">₹{p.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

      </div>
    </DashboardLayoutShell>
  );
}
