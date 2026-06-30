import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { PaymentFormData } from '../types';
import { useAppStore } from '@/lib/store';
import { CreditCard, History, Wallet, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentFormProps {
  onSavePayment: (data: PaymentFormData) => Promise<any>;
  isLoading?: boolean;
}

/**
 * Responsive payment logging form with advance/partial due checks
 */
export const PaymentForm: React.FC<PaymentFormProps> = ({ onSavePayment, isLoading = false }) => {
  const customers = useAppStore(state => state.customers);
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque'>('upi');
  const [refNum, setRefNum] = useState('');
  const [notes, setNotes] = useState('');

  const selectedCust = customers.find(c => c.id === customerId);
  const currentDues = selectedCust?.balance || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !amount) return;

    onSavePayment({
      customer_id: customerId,
      amount: Number(amount),
      payment_date: new Date().toISOString(),
      payment_method: method,
      reference_number: refNum || undefined,
      notes: notes || undefined
    });

    setAmount('');
    setRefNum('');
    setNotes('');
  };

  return (
    <Card title="Record Collection Receipt" subtitle="Log cash, UPI, bank transfer settlements">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Customer Source</label>
          <select 
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
            disabled={isLoading}
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} (Due: ₹{c.balance})
              </option>
            ))}
          </select>
        </div>

        {selectedCust && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 rounded-xl space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Outstanding Balance:</span>
              <span className="font-bold text-slate-700">₹{currentDues}</span>
            </div>
            {Number(amount) > currentDues && currentDues > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Advance Credit Amount:</span>
                <span>+₹{(Number(amount) - currentDues).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <Input 
          label="Amount Paid (₹)" 
          type="number" 
          placeholder="e.g. 500" 
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
          disabled={isLoading}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Payment Method</label>
            <select 
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={method}
              onChange={e => setMethod(e.target.value as any)}
              disabled={isLoading}
            >
              <option value="upi">UPI / GPay</option>
              <option value="cash">Cash Handover</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <Input 
            label="Ref Number (Optional)" 
            placeholder="e.g. Txn ID" 
            value={refNum}
            onChange={e => setRefNum(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <Input 
          label="Remarks / Notes" 
          placeholder="Add memo info here" 
          value={notes}
          onChange={e => setNotes(e.target.value)}
          disabled={isLoading}
        />

        <Button type="submit" disabled={isLoading} className="w-full gap-2 py-2.5 rounded-xl">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Log Collection
        </Button>
      </form>
    </Card>
  );
};

interface CustomerLedgerViewProps {
  timeline: any[];
  isLoading?: boolean;
}

/**
 * Customer ledger tracking timeline payouts and deliveries
 */
export const CustomerLedgerView: React.FC<CustomerLedgerViewProps> = ({ timeline, isLoading = false }) => {
  return (
    <Card title="Client Transaction Ledger" subtitle="Timeline of deliveries, receipts and refund corrections">
      <div className="overflow-y-auto max-h-96 text-xs space-y-3 pr-2">
        {timeline.length > 0 ? (
          timeline.map((item, idx) => (
            <div key={item.id || idx} className="flex justify-between items-start p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant={item.impact === 'payment' ? 'secondary' : (item.type === 'refund' ? 'danger' : 'primary')}>
                    {item.type}
                  </Badge>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.date}</span>
                </div>
                <p className="text-slate-600 font-semibold">{item.description}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${item.impact === 'payment' ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {item.impact === 'payment' ? '-' : '+'}₹{item.amount}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">No transaction history found.</p>
        )}
      </div>
    </Card>
  );
};
export { PaymentForm as default };
