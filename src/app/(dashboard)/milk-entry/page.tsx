'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayoutShell } from '@/components/layout';
import { Card, Badge, Button, Input } from '@/components/ui';
import { Milk, ClipboardCheck, History, AlertCircle, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { useAppStore, MilkType } from '@/lib/store';
import { toast } from 'sonner';

const SHIFT_BADGE: Record<string, 'primary' | 'warning'> = { morning: 'primary', evening: 'warning' };
const TYPE_BADGE: Record<MilkType, 'primary' | 'warning' | 'neutral' | 'secondary'> = {
  cow: 'primary',
  buffalo: 'warning',
  mixed: 'neutral',
  both: 'secondary',
};

export default function MilkEntryPage() {
  const customers = useAppStore((state) => state.customers);
  const milkEntries = useAppStore((state) => state.milkEntries);
  const addMilkEntry = useAppStore((state) => state.addMilkEntry);
  const deleteMilkEntry = useAppStore((state) => state.deleteMilkEntry);

  const today = new Date().toISOString().split('T')[0];
  const [customerId, setCustomerId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [shift, setShift] = useState<'morning' | 'evening'>('morning');
  const [date, setDate] = useState(today);
  const [entryMilkType, setEntryMilkType] = useState<'cow' | 'buffalo'>('cow');
  const [isSaving, setIsSaving] = useState(false);

  // Deletion States
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Set first customer once loaded
  useEffect(() => {
    if (customers.length > 0 && !customerId) {
      const params = new URLSearchParams(window.location.search);
      const urlCustId = params.get('customerId');
      if (urlCustId && customers.find(c => c.id === urlCustId)) {
        setCustomerId(urlCustId);
      } else {
        setCustomerId(customers[0].id);
      }
    }
  }, [customers, customerId]);

  const selectedCust = customers.find(c => c.id === customerId);
  const isBothType = selectedCust?.milkType === 'both';

  // Determine rate based on milk type selection
  const effectiveRate = isBothType
    ? (entryMilkType === 'cow' ? selectedCust!.rateCow : selectedCust!.rateBuffalo)
    : selectedCust?.rate ?? 0;

  // Effective milk type for the entry
  const effectiveMilkType: MilkType = isBothType ? entryMilkType : (selectedCust?.milkType ?? 'cow');

  const handleAsYesterday = () => {
    if (!customerId) return;
    const prev = milkEntries.find(e => e.customerId === customerId);
    if (prev) {
      setQuantity(prev.quantity.toString());
      toast.success(`Copied ${prev.quantity} L from previous entry`);
    } else {
      toast.error('No previous entry found for this customer');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !quantity) {
      toast.error('Please select a customer and enter quantity.');
      return;
    }
    if (!selectedCust) {
      toast.error('Selected customer not found. Please refresh.');
      return;
    }

    setIsSaving(true);
    try {
      await addMilkEntry({
        customerId,
        customerName: selectedCust.name,
        date,
        shift,
        quantity: Number(quantity),
        rate: effectiveRate,
        milkType: effectiveMilkType,
        amount: Math.round(Number(quantity) * effectiveRate),
      });
      toast.success(`✓ Logged ${quantity} L for ${selectedCust.name} (${effectiveMilkType})`);
      setQuantity('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteMilkEntry(entryToDelete);
      toast.success('✓ Milk entry deleted and balances recalculated successfully.');
      setEntryToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete entry.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickAddLiters = (amount: number) => {
    const current = Number(quantity) || 0;
    setQuantity((current + amount).toString());
  };

  const handleQuickAddRupees = (rs: number) => {
    if (effectiveRate <= 0) {
      toast.error('Rate is zero. Select customer first.');
      return;
    }
    const current = Number(quantity) || 0;
    const addedLiters = rs / effectiveRate;
    // Round UP to 2 decimal places (e.g., 0.334 -> 0.34) to match DB scale NUMERIC(6,2)
    const newQty = Math.ceil((current + addedLiters) * 100) / 100;
    setQuantity(newQty.toString());
  };

  const handleNoMilkWhatsApp = () => {
    if (!selectedCust) {
      toast.error('Select a customer first.');
      return;
    }
    if (!selectedCust.phone) {
      toast.error('Customer has no phone number.');
      return;
    }
    const businessName = localStorage.getItem('business_name') || 'Ganga Dairy Farm';
    const msg = localStorage.getItem('whatsapp_no_milk') || 'You did not take milk today.';
    const greeting = localStorage.getItem('whatsapp_greeting') || 'Hello';
    
    const text = `${greeting} ${selectedCust.name},\n\n*${businessName}*\n----------------------------------------------\n${msg}\n----------------------------------------------`;
    const url = `https://wa.me/91${selectedCust.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <DashboardLayoutShell title="Daily Milk Entry">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Entry Form */}
        <div>
          <Card title="Record Collection" subtitle="Log morning or evening milk yield">
            {customers.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <AlertCircle className="w-8 h-8 text-amber-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No customers found.<br />
                  <span className="font-semibold text-blue-600">Add a customer first</span> from the Customers page.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Customer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Customer</label>
                  <select
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                    value={customerId}
                    onChange={e => { setCustomerId(e.target.value); setEntryMilkType('cow'); }}
                    disabled={isSaving}
                    required
                  >
                    <option value="">— Select customer —</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.milkType === 'both' ? 'Both Types' : `${c.milkType} · ₹${c.rate}/L`})
                      </option>
                    ))}
                  </select>
                </div>

                {/* For "both" type: show cow/buffalo toggle */}
                {isBothType && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Milk Type for This Entry</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEntryMilkType('cow')}
                        className={`py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                          entryMilkType === 'cow'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Cow — ₹{selectedCust?.rateCow}/L
                      </button>
                      <button
                        type="button"
                        onClick={() => setEntryMilkType('buffalo')}
                        className={`py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                          entryMilkType === 'buffalo'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Buffalo — ₹{selectedCust?.rateBuffalo}/L
                      </button>
                    </div>
                  </div>
                )}

                {/* Shift + Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Shift</label>
                    <select
                      className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                      value={shift}
                      onChange={e => setShift(e.target.value as any)}
                      disabled={isSaving}
                    >
                      <option value="morning">Morning</option>
                      <option value="evening">Evening</option>
                    </select>
                  </div>
                  <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} disabled={isSaving} />
                </div>

                {/* Quantity */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="flex-1">
                      <Input
                        label="Quantity (Liters)"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 10.5"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        required
                        disabled={isSaving}
                      />
                    </div>
                    <div className="flex gap-2 sm:flex-col shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAsYesterday}
                        disabled={isSaving || !customerId}
                        className="flex-1 sm:flex-none h-[38px] px-3 text-xs border-dashed justify-center"
                      >
                        <History className="w-3.5 h-3.5 mr-1" /> Copy prev
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleNoMilkWhatsApp}
                        disabled={isSaving || !customerId || !selectedCust?.phone}
                        className="flex-1 sm:flex-none h-[38px] px-3 text-xs border-dashed text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 justify-center"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1" /> No Milk Msg
                      </Button>
                    </div>
                  </div>

                  {/* Quick Add Buttons */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Quick Add (Liters)</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[0.25, 0.5, 0.75, 1].map(val => (
                          <button
                            key={`L-${val}`}
                            type="button"
                            onClick={() => handleQuickAddLiters(val)}
                            className="px-2 py-1.5 bg-white border border-blue-100 text-blue-700 hover:bg-blue-50 hover:border-blue-200 dark:bg-slate-900 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-900/30 text-[11px] font-bold rounded-lg shadow-sm transition-all"
                          >
                            +{val}L
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Quick Add (Rupees)</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[2, 3, 5, 10].map(val => (
                          <button
                            key={`Rs-${val}`}
                            type="button"
                            onClick={() => handleQuickAddRupees(val)}
                            className="px-2 py-1.5 bg-white border border-emerald-100 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 dark:bg-slate-900 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 text-[11px] font-bold rounded-lg shadow-sm transition-all"
                          >
                            +₹{val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Amount Preview */}
                {customerId && quantity && effectiveRate > 0 && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                    Rate: <span className="font-semibold">₹{effectiveRate}/L</span>
                    {' · '}Total: <span className="font-bold text-slate-800 dark:text-slate-100">
                      ₹{Math.round(Number(quantity) * effectiveRate)}
                    </span>
                  </div>
                )}

                <Button type="submit" variant="secondary" disabled={isSaving || !customerId} className="w-full gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Entry'}
                </Button>
              </form>
            )}
          </Card>
        </div>

        {/* Entries Table */}
        <div className="lg:col-span-2">
          <Card title="Recent Entries" subtitle="Latest milk collection records">
            {milkEntries.length === 0 ? (
              <div className="py-12 text-center">
                <Milk className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">No entries yet. Log your first collection above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Shift</th>
                      <th className="py-3 px-3">Qty</th>
                      <th className="py-3 px-3">Rate</th>
                      <th className="py-3 px-3 text-right">Amount</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {milkEntries.slice(0, 50).map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{entry.date}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-100">{entry.customerName}</td>
                        <td className="py-3 px-3">
                          <Badge variant={TYPE_BADGE[entry.milkType ?? 'cow']} className="capitalize text-[10px]">
                            {entry.milkType ?? 'cow'}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={SHIFT_BADGE[entry.shift]} className="capitalize text-[10px]">
                            {entry.shift}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 font-medium">{entry.quantity} L</td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400">₹{entry.rate}/L</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800 dark:text-slate-100">₹{entry.amount.toFixed(2)}</td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setEntryToDelete(entry.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

      </div>

      {/* Confirmation Dialog Overlay for Milk Entry Deletion */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Delete Milk Entry?</h3>
                <p className="text-[11px] text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete this milk collection entry? Customer balance dues and analytics will be recalculated automatically.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setEntryToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleDeleteEntry}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayoutShell>
  );
}
