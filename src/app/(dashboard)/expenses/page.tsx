'use client';

import React, { useState } from 'react';
import { DashboardLayoutShell } from '@/components/layout';
import { Card, Badge, Button, Input } from '@/components/ui';
import { Wallet } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export default function ExpensesPage() {
  const expenses = useAppStore((state) => state.expenses);
  const customers = useAppStore((state) => state.customers);
  const addExpense = useAppStore((state) => state.addExpense);

  const [category, setCategory] = useState('feed');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) {
      toast.error('Please fill in description and amount.');
      return;
    }
    if (category === 'customer_credit_settlement' && !selectedCustomerId) {
      toast.error('Please select a customer to settle credit.');
      return;
    }
    setIsSaving(true);
    try {
      await addExpense({ 
        category, 
        description, 
        amount: Number(amount), 
        date,
        customerId: category === 'customer_credit_settlement' ? selectedCustomerId : undefined
      });
      toast.success('✓ Expense recorded successfully!');
      setDescription('');
      setAmount('');
      setSelectedCustomerId('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save expense.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayoutShell title="Expense Tracker">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Record new expense */}
        <div>
          <Card title="Record Outflow" subtitle="Log business expenses and payouts">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Category</label>
                <select 
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="feed">Cattle Feed / Nutrition</option>
                  <option value="veterinary">Veterinary / Medicines</option>
                  <option value="salary">Staff Salary</option>
                  <option value="transport">Transport / Diesel</option>
                  <option value="maintenance">Maintenance / Repair</option>
                  <option value="customer_credit_settlement">Customer Credit Settlement</option>
                  <option value="other">Other Outflow</option>
                </select>
              </div>

              {category === 'customer_credit_settlement' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Select Customer</label>
                  <select 
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (Bal: ₹{c.balance.toFixed(2)})</option>
                    ))}
                  </select>
                </div>
              )}

              <Input 
                label="Description" 
                placeholder="e.g. Bought 2 bags of vitamins" 
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input 
                  label="Amount (₹)" 
                  type="number" 
                  placeholder="e.g. 1500" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
                <Input 
                  label="Date" 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                />
              </div>

              <Button type="submit" variant="danger" className="w-full gap-2" disabled={isSaving}>
                <Wallet className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Expense'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Expense log table */}
        <div className="lg:col-span-2">
          <Card title="Business Expenses Log" subtitle="Logbook of all capital payouts">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {expenses.map(ex => {
                    const matchCust = customers.find(c => c.id === ex.customerId);
                    const cleanCategoryName = ex.category === 'customer_credit_settlement' ? 'Credit Settlement' : ex.category;
                    return (
                      <tr key={ex.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="py-3.5 px-4">{ex.date}</td>
                        <td className="py-3.5 px-4">
                          <Badge variant={ex.category === 'customer_credit_settlement' ? 'primary' : 'neutral'} className="capitalize">
                            {cleanCategoryName}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-semibold">
                          {ex.description}
                          {matchCust && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-normal">
                              To customer: {matchCust.name}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400">₹{ex.amount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      </div>
    </DashboardLayoutShell>
  );
}
