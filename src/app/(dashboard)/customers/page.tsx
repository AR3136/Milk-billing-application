'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayoutShell } from '@/components/layout';
import { Card, Button, Input, Badge } from '@/components/ui';
import { Users, UserPlus, Search, Phone } from 'lucide-react';
import { useAppStore, MilkType } from '@/lib/store';
import { toast } from 'sonner';

const MILK_TYPE_LABELS: Record<MilkType, string> = {
  cow: 'Cow',
  buffalo: 'Buffalo',
  mixed: 'Mixed',
  both: 'Both (Cow + Buffalo)',
};

const MILK_TYPE_COLORS: Record<MilkType, 'primary' | 'warning' | 'neutral' | 'secondary'> = {
  cow: 'primary',
  buffalo: 'warning',
  mixed: 'neutral',
  both: 'secondary',
};

export default function CustomersPage() {
  const router = useRouter();
  const customers = useAppStore((state) => state.customers);
  const addCustomer = useAppStore((state) => state.addCustomer);

  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [milkType, setMilkType] = useState<MilkType>('cow');
  const [rate, setRate] = useState(45);
  const [rateCow, setRateCow] = useState(45);
  const [rateBuffalo, setRateBuffalo] = useState(60);
  const [isSaving, setIsSaving] = useState(false);

  // Load default rates from settings on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCow = localStorage.getItem('rate_cow');
      const savedBuffalo = localStorage.getItem('rate_buffalo');
      if (savedCow) {
        setRate(Number(savedCow));
        setRateCow(Number(savedCow));
      }
      if (savedBuffalo) {
        setRateBuffalo(Number(savedBuffalo));
      }
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error('Name and phone are required.');
      return;
    }
    setIsSaving(true);
    try {
      await addCustomer({
        name: name.trim(),
        phone: phone.trim(),
        milkType,
        rate: milkType === 'both' ? 0 : rate,
        rateCow: milkType === 'both' ? rateCow : rate,
        rateBuffalo: milkType === 'both' ? rateBuffalo : rate,
        isActive: true,
      });
      toast.success(`✓ Customer "${name.trim()}" added!`);
      setName('');
      setPhone('');
      setRate(45);
      setRateCow(45);
      setRateBuffalo(60);
      setMilkType('cow');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add customer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <DashboardLayoutShell title="Customers Directory">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Customer list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="w-full bg-transparent text-sm focus:outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <Card title="All Customers" subtitle={`${customers.length} registered (click anywhere on a member row to view details)`}>
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  {customers.length === 0 ? 'No customers yet. Add your first customer.' : 'No customers match your search.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filtered.map(cust => (
                  <div 
                    key={cust.id} 
                    onClick={() => router.push(`/milk-entry?customerId=${cust.id}`)}
                    className="py-3.5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-900/30 px-3 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                        {cust.name[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{cust.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {cust.phone}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      <div className="text-right flex flex-col items-end shrink-0">
                        <Badge variant={MILK_TYPE_COLORS[cust.milkType]} className="text-[9px] sm:text-[10px] px-1.5 py-0.5 sm:px-2">
                          {MILK_TYPE_LABELS[cust.milkType]}
                        </Badge>
                        {cust.milkType === 'both' ? (
                          <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
                            Cow ₹{cust.rateCow} · Buf ₹{cust.rateBuffalo}
                          </p>
                        ) : (
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">₹{cust.rate}/L</p>
                        )}
                      </div>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="px-3.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wide"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/customers/${cust.id}`);
                        }}
                      >
                        Report
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Add Customer Form */}
        <div>
          <Card title="Add Customer" subtitle="Register a new dairy customer">
            <form onSubmit={handleCreate} className="space-y-4">
              <Input label="Full Name" placeholder="e.g. Ramesh Patil" value={name} onChange={e => setName(e.target.value)} required disabled={isSaving} />
              <Input label="Phone Number" placeholder="e.g. 9812345678" value={phone} onChange={e => setPhone(e.target.value)} required disabled={isSaving} />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Milk Type</label>
                <select
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                  value={milkType}
                  onChange={e => {
                    const type = e.target.value as MilkType;
                    setMilkType(type);
                    if (typeof window !== 'undefined') {
                      if (type === 'cow') setRate(Number(localStorage.getItem('rate_cow')) || 45);
                      else if (type === 'buffalo') setRate(Number(localStorage.getItem('rate_buffalo')) || 60);
                      else if (type === 'mixed') setRate(Number(localStorage.getItem('rate_mixed')) || 52);
                    }
                  }}
                  disabled={isSaving}
                >
                  <option value="cow">Cow Milk</option>
                  <option value="buffalo">Buffalo Milk</option>
                  <option value="mixed">Mixed</option>
                  <option value="both">Both (Cow & Buffalo)</option>
                </select>
              </div>

              {/* Rate fields based on milk type */}
              {milkType === 'both' ? (
                <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Individual rates for each milk type:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Cow Rate (₹/L)"
                      type="number"
                      min="1"
                      value={rateCow}
                      onChange={e => setRateCow(Number(e.target.value))}
                      required
                      disabled={isSaving}
                    />
                    <Input
                      label="Buffalo Rate (₹/L)"
                      type="number"
                      min="1"
                      value={rateBuffalo}
                      onChange={e => setRateBuffalo(Number(e.target.value))}
                      required
                      disabled={isSaving}
                    />
                  </div>
                </div>
              ) : (
                <Input
                  label="Rate per Liter (₹)"
                  type="number"
                  min="1"
                  value={rate}
                  onChange={e => setRate(Number(e.target.value))}
                  required
                  disabled={isSaving}
                />
              )}

              <Button type="submit" className="w-full gap-2 mt-2" disabled={isSaving}>
                <UserPlus className="w-4 h-4" />
                {isSaving ? 'Adding...' : 'Add Customer'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </DashboardLayoutShell>
  );
}
