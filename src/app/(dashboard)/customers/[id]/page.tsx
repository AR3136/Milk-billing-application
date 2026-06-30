'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayoutShell } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, Calendar, FileText, Milk, Phone, MapPin, User, ArrowUpRight } from 'lucide-react';

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

  const customer = customers.find(c => c.id === id);

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

  // Filter entries
  const customerEntries = milkEntries.filter(e => e.customerId === id);
  const customerPayments = payments.filter(p => p.customerId === id);

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
                  <p className="text-xl font-extrabold text-rose-600 mt-1">₹{customer.balance}</p>
                </div>
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
    </DashboardLayoutShell>
  );
}
