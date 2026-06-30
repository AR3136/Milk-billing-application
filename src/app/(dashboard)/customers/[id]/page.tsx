'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayoutShell } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, Calendar, FileText, Milk, Phone, MapPin, User, ArrowUpRight, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  
  // Resolve params using React.use() to satisfy Next.js 16 requirements if params is a Promise
  const unwrappedParams = React.use(params as any) as any;
  const id = unwrappedParams.id;

  const customers = useAppStore((state) => state.customers);
  const milkEntries = useAppStore((state) => state.milkEntries);
  const payments = useAppStore((state) => state.payments);
  const deleteCustomer = useAppStore((state) => state.deleteCustomer);

  const customer = customers.find(c => c.id === id);

  const [canDelete, setCanDelete] = useState(true);
  const [validationReasons, setValidationReasons] = useState<string[]>([]);
  const [isCheckingDues, setIsCheckingDues] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Filter entries
  const customerEntries = milkEntries.filter(e => e.customerId === id);
  const customerPayments = payments.filter(p => p.customerId === id);

  useEffect(() => {
    async function checkDeletionRules() {
      if (!customer) return;
      setIsCheckingDues(true);
      const reasons: string[] = [];

      // Rule 1: Outstanding balance is ₹0
      if (customer.balance !== 0) {
        reasons.push(`Outstanding balance is ₹${customer.balance.toFixed(2)} (must be ₹0.00).`);
      }

      // Rule 2: No bills exist
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { count, error } = await supabase
          .from('bills')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', id)
          .is('deleted_at', null);

        if (error) throw error;
        if (count && count > 0) {
          reasons.push('Billing history records exist.');
        }
      } catch (err: any) {
        console.error('Error checking bills:', err);
      }

      setValidationReasons(reasons);
      setCanDelete(reasons.length === 0);
      setIsCheckingDues(false);
    }

    checkDeletionRules();
  }, [id, customerEntries.length, customerPayments.length, customer?.balance]);

  if (!customer) {
    return (
      <DashboardLayoutShell title="Customer Profile">
        <div className="text-center py-12 space-y-4">
          <p className="text-slate-500">Customer record not found.</p>
          <Button onClick={() => router.push('/customers')}>Back to Directory</Button>
        </div>
      </DashboardLayoutShell>
    );
  }

  // Daily Average
  const dailyAverage = customerEntries.length > 0 
    ? (customerEntries.reduce((sum, e) => sum + e.quantity, 0) / customerEntries.length).toFixed(1)
    : '0';

  // Weekly Total (Last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyTotal = customerEntries
    .filter(e => new Date(e.date) >= oneWeekAgo)
    .reduce((sum, e) => sum + e.quantity, 0)
    .toFixed(1);

  // Monthly Total (Last 30 days)
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  const monthlyTotal = customerEntries
    .filter(e => new Date(e.date) >= oneMonthAgo)
    .reduce((sum, e) => sum + e.quantity, 0)
    .toFixed(1);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCustomer(id);
      toast.success(`✓ Customer "${customer.name}" deleted successfully.`);
      router.push('/customers');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete customer.');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <DashboardLayoutShell title="Customer Analytics & Profile">
      <div className="space-y-6">
        
        {/* Back navigation header */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/customers')} 
            className="p-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{customer.name}</h2>
            <p className="text-xs text-slate-500">Overview of yields, collections, and dues ledgers</p>
          </div>
        </div>

        {/* Top summary row: Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Daily Average Yield" subtitle="Average liters logged per entry">
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold text-blue-600">{dailyAverage} L</span>
              <span className="text-xs text-slate-400">/ delivery</span>
            </div>
          </Card>
          <Card title="Weekly Total Purchased" subtitle="Volume logged in last 7 days">
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold text-emerald-600">{weeklyTotal} L</span>
              <span className="text-xs text-slate-400">total</span>
            </div>
          </Card>
          <Card title="Monthly Total Purchased" subtitle="Volume logged in last 30 days">
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold text-violet-600">{monthlyTotal} L</span>
              <span className="text-xs text-slate-400">total</span>
            </div>
          </Card>
        </div>

        {/* Mid section splits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Customer info card */}
          <div className="space-y-4">
            <Card title="Member Account Details">
              <div className="space-y-4 text-xs pt-2">
                <div className="flex gap-2.5 items-start">
                  <User className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-500">Contact Name</p>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5">{customer.name}</p>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-500">Phone Number</p>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5">{customer.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-500">Pricing Schemes</p>
                    {customer.milkType === 'both' ? (
                      <div className="space-y-0.5 text-slate-800 dark:text-slate-200 font-semibold mt-0.5">
                        <Badge variant="secondary">Both (Cow + Buffalo)</Badge>
                        <p className="text-[11px] text-slate-500">🐄 Cow: ₹{customer.rateCow}/L</p>
                        <p className="text-[11px] text-slate-500">🐃 Buffalo: ₹{customer.rateBuffalo}/L</p>
                      </div>
                    ) : (
                      <p className="text-slate-850 dark:text-slate-200 mt-0.5 uppercase font-bold text-blue-600">
                        {customer.milkType} Milk · ₹{customer.rate}/L
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <p className="text-[10px] uppercase text-slate-500 font-bold">Outstanding Balance</p>
                  <p className="text-xl font-extrabold text-rose-600 mt-1">₹{customer.balance.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            {/* Secure Deletion Rules Enforcer UI */}
            <Card title="Account Maintenance" subtitle="Options for terminating customer profiles">
              <div className="space-y-3">
                {isCheckingDues ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    Checking secure deletion rules...
                  </div>
                ) : !canDelete ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-xl flex items-start gap-2 text-[11px]">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-1">Delete Option Disabled</span>
                        <ul className="list-disc pl-3.5 space-y-0.5">
                          {validationReasons.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    </div>
                    <Button variant="danger" disabled className="w-full text-xs font-semibold py-2.5 rounded-xl cursor-not-allowed">
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Member
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500">This member is clean and eligible for deletion. No active records or balance dues found.</p>
                    <Button 
                      variant="danger" 
                      onClick={() => setShowConfirm(true)} 
                      className="w-full text-xs font-bold py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Member
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Detailed entries logs */}
          <div className="lg:col-span-2">
            <Card title="Deliveries History Logbook" subtitle="Showing all collection entries recorded for this user">
              <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold sticky top-0 bg-white dark:bg-slate-800 z-10">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Shift</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Applied Rate</th>
                      <th className="py-2.5 px-3 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {customerEntries.length > 0 ? (
                      customerEntries.map((e) => (
                         <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="py-2.5 px-3">{e.date}</td>
                          <td className="py-2.5 px-3 capitalize">
                            <Badge variant={e.shift === 'morning' ? 'primary' : 'warning'}>
                              {e.shift}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 capitalize">
                            <Badge variant={e.milkType === 'cow' ? 'primary' : e.milkType === 'buffalo' ? 'warning' : 'neutral'} className="text-[10px]">
                              {e.milkType}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 font-semibold">{e.quantity} L</td>
                          <td className="py-2.5 px-3 text-right">₹{e.rate}/L</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-100">₹{e.amount}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">No milk yields logged for this member yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

        </div>

      </div>

      {/* Confirmation Dialog Overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Delete Customer Profile?</h3>
                <p className="text-[11px] text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete the profile of <span className="font-bold text-slate-800">"{customer.name}"</span>?
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleDelete}
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
