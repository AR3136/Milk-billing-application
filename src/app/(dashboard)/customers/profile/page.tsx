'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayoutShell } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, Calendar, FileText, Milk, Phone, MapPin, User, ArrowUpRight, Trash2, AlertCircle, Loader2, Edit } from 'lucide-react';
import { toast } from 'sonner';

function CustomerDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const customers = useAppStore((state) => state.customers);
  const milkEntries = useAppStore((state) => state.milkEntries);
  const payments = useAppStore((state) => state.payments);
  const expenses = useAppStore((state) => state.expenses);
  const deleteCustomer = useAppStore((state) => state.deleteCustomer);

  const customer = customers.find(c => c.id === id);

  const [canDelete, setCanDelete] = useState(true);
  const [validationReasons, setValidationReasons] = useState<string[]>([]);
  const [isCheckingDues, setIsCheckingDues] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Edit fields state
  const updateCustomer = useAppStore((state) => state.updateCustomer);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editMilkType, setEditMilkType] = useState<'cow' | 'buffalo' | 'mixed' | 'both'>('cow');
  const [editRate, setEditRate] = useState(45);
  const [editRateCow, setEditRateCow] = useState(45);
  const [editRateBuffalo, setEditRateBuffalo] = useState(60);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editMessageLanguage, setEditMessageLanguage] = useState<'english' | 'marathi'>('english');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Filter entries
  const customerEntries = milkEntries.filter(e => e.customerId === id);
  const customerPayments = payments.filter(p => p.customerId === id);
  const customerSettlements = expenses.filter(
    ex => ex.category === 'customer_credit_settlement' && ex.customerId === id
  );

  // Combine payments and settlements for unified history display
  const combinedHistory = [
    ...customerPayments.map(p => ({
      id: p.id,
      date: p.date,
      type: 'payment' as const,
      method: p.method,
      amount: p.amount,
    })),
    ...customerSettlements.map(ex => ({
      id: ex.id,
      date: ex.date,
      type: 'settlement' as const,
      method: 'credit settlement',
      amount: ex.amount,
    }))
  ].sort((a, b) => b.date.localeCompare(a.date));

  useEffect(() => {
    async function checkDeletionRules() {
      if (!customer) return;
      setIsCheckingDues(true);
      const reasons: string[] = [];

      // Rule 1: Outstanding balance is ₹0
      if (Math.abs(customer.balance) > 0.01) {
        reasons.push(`Outstanding balance is ₹${customer.balance.toFixed(2)} (must be ₹0.00).`);
      }

      setValidationReasons(reasons);
      setCanDelete(reasons.length === 0);
      setIsCheckingDues(false);
    }

    checkDeletionRules();
  }, [id, customer?.balance]);

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

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPhone.trim()) {
      toast.error('Name and phone are required.');
      return;
    }
    setIsSavingEdit(true);
    try {
      await updateCustomer(customer.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        milkType: editMilkType,
        rate: editMilkType === 'both' ? 0 : Number(editRate),
        rateCow: editMilkType === 'both' ? Number(editRateCow) : Number(editRate),
        rateBuffalo: editMilkType === 'both' ? Number(editRateBuffalo) : Number(editRate),
        isActive: editIsActive,
        messageLanguage: editMessageLanguage,
      });
      toast.success('✓ Customer details updated successfully!');
      setShowEditModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update customer details.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCustomer(id!);
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
    <DashboardLayoutShell title={`Profile: ${customer.name}`}>
      <div className="space-y-6">
        
        {/* Back navigation button */}
        <div className="no-print">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/customers')}
            className="gap-1.5 py-1.5 px-3.5 text-xs font-semibold rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Directory
          </Button>
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
            <Card>
              <div className="flex justify-between items-center mb-4 border-b border-slate-50 dark:border-slate-800/60 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100">Member Account Details</h3>
                  <p className="text-[10px] text-slate-500">Contact config & rates</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setEditName(customer.name);
                    setEditPhone(customer.phone);
                    setEditMilkType(customer.milkType);
                    setEditRate(customer.rate);
                    setEditRateCow(customer.rateCow);
                    setEditRateBuffalo(customer.rateBuffalo);
                    setEditIsActive(customer.isActive);
                    setEditMessageLanguage(customer.messageLanguage || 'english');
                    setShowEditModal(true);
                  }} 
                  className="gap-1.5 py-1.5 px-3 text-[10px] font-bold rounded-xl"
                >
                  <Edit className="w-3 h-3" /> Edit
                </Button>
              </div>
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
                  <Calendar className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-500">Message Language</p>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5 capitalize font-medium">{customer.messageLanguage || 'english'}</p>
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
                  <p className={`text-xl font-extrabold mt-1 ${customer.balance < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {customer.balance < 0 ? `₹${Math.abs(customer.balance).toFixed(2)} (Credit)` : `₹${customer.balance.toFixed(2)} (Dues)`}
                  </p>
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

          {/* Detailed entries and payments logs */}
          <div className="lg:col-span-2 space-y-6">
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

            <Card title="Payments History Logbook" subtitle="Showing all payment receipts logged for this user">
              <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold sticky top-0 bg-white dark:bg-slate-800 z-10">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type / Method</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {combinedHistory.length > 0 ? (
                      combinedHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="py-2.5 px-3">{item.date}</td>
                          <td className="py-2.5 px-3 capitalize font-semibold">
                            {item.type === 'payment' ? (
                              <Badge variant={item.method === 'upi' ? 'primary' : 'secondary'}>
                                {item.method}
                              </Badge>
                            ) : (
                              <Badge variant="neutral" className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                                Settle Credit
                              </Badge>
                            )}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-black ${item.type === 'payment' ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'}`}>
                            {item.type === 'payment' ? '+' : '-'}₹{item.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-500">No payment or settlement receipts logged for this member yet.</td>
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

      {/* Edit Member Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-scale-in my-8">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center shrink-0">
                <Edit className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Edit Member Details</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">Update customer details & pricing</p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Contact Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                    placeholder="e.g. Ramesh Kumar"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Phone Number</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                    placeholder="e.g. +91 98765 43210"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Milk Type</label>
                  <select 
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                    value={editMilkType}
                    onChange={e => setEditMilkType(e.target.value as any)}
                  >
                    <option value="cow" className="bg-white dark:bg-slate-800">Cow</option>
                    <option value="buffalo" className="bg-white dark:bg-slate-800">Buffalo</option>
                    <option value="mixed" className="bg-white dark:bg-slate-800">Mixed</option>
                    <option value="both" className="bg-white dark:bg-slate-800">Both (Cow + Buffalo)</option>
                  </select>
                </div>

                {editMilkType === 'both' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Cow Rate (₹/L)</label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                        value={editRateCow}
                        onChange={e => setEditRateCow(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Buffalo Rate (₹/L)</label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                        value={editRateBuffalo}
                        onChange={e => setEditRateBuffalo(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Milk Rate (₹/L)</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                      value={editRate}
                      onChange={e => setEditRate(Number(e.target.value))}
                      required
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Message Language</label>
                  <select 
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                    value={editMessageLanguage}
                    onChange={e => setEditMessageLanguage(e.target.value as any)}
                  >
                    <option value="english" className="bg-white dark:bg-slate-800">English (Default)</option>
                    <option value="marathi" className="bg-white dark:bg-slate-800">Marathi (मराठी)</option>
                  </select>
                </div>

                <div className="flex justify-between items-center pt-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div>
                    <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-200">Active Status</h5>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Check to allow deliveries</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer accent-blue-600"
                    checked={editIsActive}
                    onChange={e => setEditIsActive(e.target.checked)}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <Button 
                  variant="outline" 
                  size="sm" 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-xs font-semibold rounded-xl dark:border-slate-700"
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Details
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayoutShell>
  );
}

export default function CustomerDetailPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-500">Loading profile...</div>}>
      <CustomerDetailContent />
    </Suspense>
  );
}

