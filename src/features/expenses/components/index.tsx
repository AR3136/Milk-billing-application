import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { ExpenseFormData } from '../types';
import { Wallet, Save, Calendar, Trash2, PieChart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExpenseFormCardProps {
  onSaveExpense: (data: ExpenseFormData) => Promise<any>;
  isLoading?: boolean;
}

/**
 * Form card panel for logging business expenses
 */
export const ExpenseFormCard: React.FC<ExpenseFormCardProps> = ({ onSaveExpense, isLoading = false }) => {
  const [category, setCategory] = useState<'fuel' | 'salary' | 'electricity' | 'maintenance' | 'transport' | 'other'>('fuel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('2026-06-30');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    onSaveExpense({
      category,
      description,
      amount: Number(amount),
      date
    });

    setDescription('');
    setAmount('');
  };

  return (
    <Card title="Record Operating Outflow" subtitle="Log maintenance, fuel, salaries">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Expense Category</label>
          <select 
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={category}
            onChange={e => setCategory(e.target.value as any)}
            disabled={isLoading}
          >
            <option value="fuel">Fuel / Transport Diesel</option>
            <option value="salary">Staff Salary Payments</option>
            <option value="electricity">Utility / Electricity</option>
            <option value="maintenance">Cattle Shed Maintenance</option>
            <option value="transport">Milk Transport Hire</option>
            <option value="other">Other Operations</option>
          </select>
        </div>

        <Input 
          label="Expense description" 
          placeholder="e.g. Purchased generator diesel (10L)" 
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          disabled={isLoading}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input 
            label="Amount Paid (₹)" 
            type="number" 
            placeholder="e.g. 1500" 
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            disabled={isLoading}
          />
          <Input 
            label="Date Logged" 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            disabled={isLoading}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full gap-2 py-2.5 rounded-xl">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Log Expense
        </Button>
      </form>
    </Card>
  );
};

interface ExpenseCategoryChartProps {
  chartData: any[];
}

/**
 * Display layout representing category summaries and percentages
 */
export const ExpenseCategoryChart: React.FC<ExpenseCategoryChartProps> = ({ chartData }) => {
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card title="Expense Category Breakdown" subtitle="Outflow distribution analysis">
      <div className="space-y-4 text-xs">
        <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-center items-center h-48 text-center">
          <PieChart className="w-10 h-10 text-slate-300 mb-2 animate-pulse" />
          <p className="font-semibold text-slate-600">Distribution Pie Chart Mock</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Total operating costs: ₹{total.toFixed(2)}</p>
        </div>

        <div className="space-y-2">
          {chartData.map(item => {
            const percent = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <span className="capitalize text-slate-500 font-semibold">{item.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700">₹{item.value}</span>
                  <Badge variant="neutral" className="text-[9px]">{percent.toFixed(0)}%</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
export { ExpenseFormCard as default };
