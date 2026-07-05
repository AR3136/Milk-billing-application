import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { Bill } from '../types';
import { useAppStore } from '@/lib/store';
import { Printer, Download, Share2, Clipboard, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface BillInvoiceViewProps {
  bill: Bill;
  onClose?: () => void;
}

export const BillInvoiceView: React.FC<BillInvoiceViewProps> = ({ bill, onClose }) => {
  const customers = useAppStore(state => state.customers);
  const milkEntries = useAppStore(state => state.milkEntries);
  const matchedCust = customers.find(c => c.id === bill.customer_id);
  const phone = matchedCust?.phone || '9876543210';

  const [bizName, setBizName] = useState('Ganga Dairy Farm');
  const [bizAddress, setBizAddress] = useState('Ganga Chowk, Sector-4, Pune');
  const [bizGreeting, setBizGreeting] = useState('Hello');
  const [bizThankYou, setBizThankYou] = useState('Please clear the dues. Thank you!');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBizName(localStorage.getItem('business_name') || 'Ganga Dairy Farm');
      setBizAddress(localStorage.getItem('business_address') || 'Ganga Chowk, Sector-4, Pune');
      setBizGreeting(localStorage.getItem('whatsapp_greeting') || 'Hello');
      setBizThankYou(localStorage.getItem('whatsapp_thankyou') || 'Please clear the dues. Thank you!');
    }
  }, []);

  // Get actual entries for this customer in this billing cycle to calculate precise values
  const cycleEntries = milkEntries.filter(
    e => e.customerId === bill.customer_id && e.date >= bill.from_date && e.date <= bill.to_date
  );

  const cowEntries = cycleEntries.filter(e => e.milkType === 'cow');
  const buffaloEntries = cycleEntries.filter(e => e.milkType === 'buffalo');
  const mixedEntries = cycleEntries.filter(e => e.milkType !== 'cow' && e.milkType !== 'buffalo');

  const cowQty = cowEntries.reduce((sum, e) => sum + e.quantity, 0);
  const cowRate = matchedCust ? (matchedCust.milkType === 'both' ? matchedCust.rateCow : matchedCust.rate) : 0;
  const cowAmt = Math.ceil(cowQty * cowRate);

  const buffaloQty = buffaloEntries.reduce((sum, e) => sum + e.quantity, 0);
  const buffaloRate = matchedCust ? (matchedCust.milkType === 'both' ? matchedCust.rateBuffalo : matchedCust.rate) : 0;
  const buffaloAmt = Math.ceil(buffaloQty * buffaloRate);

  const mixedQty = mixedEntries.reduce((sum, e) => sum + e.quantity, 0);
  const mixedRate = matchedCust?.rate || 0;
  const mixedAmt = Math.ceil(mixedQty * mixedRate);

  // Use computed cycle values, with fallback to bill defaults if entries are not yet synced/empty
  const displayQty = cycleEntries.length > 0 ? cycleEntries.reduce((sum, e) => sum + e.quantity, 0) : bill.total_quantity;
  const displayAmt = cycleEntries.length > 0 ? Math.ceil(cowAmt + buffaloAmt + mixedAmt) : bill.total_amount;
  const avgRate = matchedCust?.rate || (displayQty > 0 ? (displayAmt / displayQty) : 0);

  // Clean quantities to avoid floating point issues (e.g. 0.8500000000000001 L)
  const cleanCowQty = parseFloat(cowQty.toFixed(2));
  const cleanBuffaloQty = parseFloat(buffaloQty.toFixed(2));
  const cleanMixedQty = parseFloat(mixedQty.toFixed(2));
  const cleanDisplayQty = parseFloat(displayQty.toFixed(2));

  const buildTextInvoice = () => {
    let breakdownText = '';
    if (cowQty > 0) {
      breakdownText += `Cow Milk: ${cleanCowQty} L X ₹${cowRate.toFixed(2)}/L = ₹${cowAmt.toFixed(2)}\n`;
    }
    if (buffaloQty > 0) {
      breakdownText += `Buffalo Milk: ${cleanBuffaloQty} L X ₹${buffaloRate.toFixed(2)}/L = ₹${buffaloAmt.toFixed(2)}\n`;
    }
    if (mixedQty > 0) {
      breakdownText += `Mixed Milk: ${cleanMixedQty} L X ₹${mixedRate.toFixed(2)}/L = ₹${mixedAmt.toFixed(2)}\n`;
    }

    if (!breakdownText) {
      breakdownText = `Milk Qty: ${cleanDisplayQty} L\nAvg Rate: ₹${avgRate.toFixed(2)}/L\n`;
    }

    let paymentText = '';
    if (bill.paid_amount > 0) {
      paymentText = `Paid in Cycle: -₹${bill.paid_amount.toFixed(2)}\n`;
    } else if (bill.paid_amount < 0) {
      paymentText = `Credit Refunded: +₹${Math.abs(bill.paid_amount).toFixed(2)}\n`;
    }

    const netVal = (bill.balance_forward || 0) + displayAmt - bill.paid_amount;
    const netPayableText = netVal < 0
      ? `*Overpaid (Credit): ₹${Math.abs(netVal).toFixed(2)}*`
      : `*Net Payable Dues: ₹${netVal.toFixed(2)}*`;

    return `${bizGreeting} ${bill.customer_name},\n\n` +
      `*${bizName.toUpperCase()} INVOICE*\n` +
      `---------------------------------\n` +
      `Invoice No: ${bill.bill_number}\n` +
      `Customer: ${bill.customer_name}\n` +
      `Billing Cycle: ${bill.from_date} to ${bill.to_date}\n` +
      `---------------------------------\n` +
      breakdownText +
      `Current Bill: ₹${displayAmt.toFixed(2)}\n` +
      `Balance Forward: ₹${(bill.balance_forward || 0).toFixed(2)}\n` +
      paymentText +
      `---------------------------------\n` +
      netPayableText +
      `\n---------------------------------\n` +
      `${bizThankYou}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyToClipboard = () => {
    const text = buildTextInvoice();
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Invoice details copied to clipboard!'))
      .catch(() => toast.error('Failed to copy text.'));
  };

  const handleWhatsAppShare = () => {
    const text = buildTextInvoice();
    const encodedText = encodeURIComponent(text);
    
    // Strip all non-digit characters to ensure WhatsApp link functions correctly
    const cleanPhone = phone.replace(/\D/g, '');
    let formattedPhone = cleanPhone;
    if (cleanPhone.length === 10) {
      formattedPhone = '91' + cleanPhone;
    }
    
    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`, '_blank');
  };

  return (
    <Card className="max-w-2xl mx-auto border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 p-8 space-y-6">
      
      {/* Invoice Header */}
      <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white font-bold">M</div>
            <span className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">{bizName}</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">{bizAddress}</p>
        </div>
        <div className="text-right text-xs">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Invoice Bill</h2>
          <p className="font-semibold text-slate-500 dark:text-slate-400 mt-1">{bill.bill_number}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Date: {bill.created_at?.slice(0, 10) || '2026-06-30'}</p>
        </div>
      </div>

      {/* Customer summary */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[9px]">Bill To</p>
          <p className="font-bold text-slate-800 dark:text-slate-100 mt-1">{bill.customer_name}</p>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">Phone: {phone}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[9px]">Billing Cycle</p>
          <p className="font-semibold text-slate-800 dark:text-slate-100 mt-1">{bill.from_date} to {bill.to_date}</p>
          <Badge variant={bill.status === 'paid' ? 'secondary' : 'warning'} className="mt-1">
            {bill.status}
          </Badge>
        </div>
      </div>

      {/* Deliveries breakdown */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px]">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Total Quantity</th>
              <th className="py-2 text-right">Rate</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
            {cowQty > 0 && (
              <tr>
                <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">Cow Milk Delivery</td>
                <td className="py-3 text-right font-medium text-slate-700 dark:text-slate-300">{cleanCowQty} L</td>
                <td className="py-3 text-right text-slate-600 dark:text-slate-400">₹{cowRate.toFixed(2)}/L</td>
                <td className="py-3 text-right font-bold text-slate-800 dark:text-slate-100">₹{cowAmt.toFixed(2)}</td>
              </tr>
            )}
            {buffaloQty > 0 && (
              <tr>
                <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">Buffalo Milk Delivery</td>
                <td className="py-3 text-right font-medium text-slate-700 dark:text-slate-300">{cleanBuffaloQty} L</td>
                <td className="py-3 text-right text-slate-600 dark:text-slate-400">₹{buffaloRate.toFixed(2)}/L</td>
                <td className="py-3 text-right font-bold text-slate-800 dark:text-slate-100">₹{buffaloAmt.toFixed(2)}</td>
              </tr>
            )}
            {mixedQty > 0 && (
              <tr>
                <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">Mixed Milk Delivery</td>
                <td className="py-3 text-right font-medium text-slate-700 dark:text-slate-300">{cleanMixedQty} L</td>
                <td className="py-3 text-right text-slate-600 dark:text-slate-400">₹{mixedRate.toFixed(2)}/L</td>
                <td className="py-3 text-right font-bold text-slate-800 dark:text-slate-100">₹{mixedAmt.toFixed(2)}</td>
              </tr>
            )}
            {cycleEntries.length === 0 && (
              <tr>
                <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">Milk Delivery Collection</td>
                <td className="py-3 text-right font-medium text-slate-700 dark:text-slate-300">{cleanDisplayQty} L</td>
                <td className="py-3 text-right text-slate-600 dark:text-slate-400">₹{avgRate.toFixed(2)}/L</td>
                <td className="py-3 text-right font-bold text-slate-800 dark:text-slate-100">₹{displayAmt.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Balance dues sheet */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex justify-end">
        <div className="w-64 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Cycle yield amount</span>
            <span className="font-semibold text-slate-800 dark:text-slate-150 font-medium">₹{displayAmt.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Balance dues forward</span>
            <span className="font-semibold text-slate-800 dark:text-slate-150 font-medium">₹{(bill.balance_forward || 0).toFixed(2)}</span>
          </div>
          {bill.paid_amount > 0 ? (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-450 font-bold">
              <span>Paid in Cycle</span>
              <span>-₹{bill.paid_amount.toFixed(2)}</span>
            </div>
          ) : bill.paid_amount < 0 ? (
            <div className="flex justify-between text-rose-600 dark:text-rose-450 font-bold">
              <span>Credit Refunded</span>
              <span>+₹{Math.abs(bill.paid_amount).toFixed(2)}</span>
            </div>
          ) : null}
          <hr className="border-slate-100 dark:border-slate-800" />
          {(() => {
            const netVal = (bill.balance_forward || 0) + displayAmt - bill.paid_amount;
            if (netVal < 0) {
              return (
                <div className="flex justify-between text-sm font-extrabold text-emerald-600 dark:text-emerald-450">
                  <span>Overpaid (Credit)</span>
                  <span>₹{Math.abs(netVal).toFixed(2)}</span>
                </div>
              );
            } else {
              return (
                <div className="flex justify-between text-sm font-extrabold text-rose-600 dark:text-rose-400">
                  <span>Net Payable dues</span>
                  <span>₹{netVal.toFixed(2)}</span>
                </div>
              );
            }
          })()}
        </div>
      </div>

      {/* Footer trigger options bar */}
      <div className="flex justify-between items-center border-t border-slate-100 pt-6 flex-wrap gap-2 text-xs no-print">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyToClipboard} className="gap-2">
            <Clipboard className="w-3.5 h-3.5" /> Copy Text
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleWhatsAppShare} className="gap-2">
            <Share2 className="w-3.5 h-3.5" /> Share WhatsApp
          </Button>
        </div>
      </div>

    </Card>
  );
};

interface BillGeneratorCardProps {
  onGenerate: (data: { customerId: string; fromDate: string; toDate: string }) => Promise<any>;
  isLoading?: boolean;
}

export const BillGeneratorCard: React.FC<BillGeneratorCardProps> = ({ onGenerate, isLoading = false }) => {
  const customers = useAppStore(state => state.customers);
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [cycle, setCycle] = useState<'weekly' | '15day' | 'monthly'>('weekly');

  const handleRun = () => {
    const today = new Date();
    const toDate = today.toISOString().slice(0, 10);
    const fromDateObj = new Date();
    
    if (cycle === 'weekly') {
      fromDateObj.setDate(today.getDate() - 7);
    } else if (cycle === '15day') {
      fromDateObj.setDate(today.getDate() - 15);
    } else {
      fromDateObj.setMonth(today.getMonth() - 1);
    }
    const fromDate = fromDateObj.toISOString().slice(0, 10);

    onGenerate({ customerId, fromDate, toDate });
  };

  return (
    <Card title="Run Billing Calculator" subtitle="Process deliveries log files into cycle invoices">
      <div className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Target Client</label>
          <select 
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
            disabled={isLoading}
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Billing Cycle Interval</label>
          <select 
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={cycle}
            onChange={e => setCycle(e.target.value as any)}
            disabled={isLoading}
          >
            <option value="weekly">Weekly Cycle (7 Days)</option>
            <option value="15day">Biweekly Cycle (15 Days)</option>
            <option value="monthly">Monthly Cycle (30 Days)</option>
          </select>
        </div>

        <Button onClick={handleRun} disabled={isLoading} className="w-full gap-2 py-2.5 rounded-xl">
          {isLoading && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
          Process Invoice
        </Button>
      </div>
    </Card>
  );
};
