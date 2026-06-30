'use client';

import React from 'react';
import { DashboardLayoutShell } from '@/components/layout';
import { Card, Badge, Button, Input } from '@/components/ui';
import { ShieldAlert, Users, Trash2, Key, ToggleRight } from 'lucide-react';

export default function AdminPage() {
  const operators = [
    { id: 1, name: 'Sanjay Patil', email: 'sanjay@dairy.com', role: 'operator', status: 'active' },
    { id: 2, name: 'Kiran Mane', email: 'kiran@dairy.com', role: 'manager', status: 'active' },
    { id: 3, name: 'Vikram Salunkhe', email: 'vikram@dairy.com', role: 'operator', status: 'suspended' },
  ];

  return (
    <DashboardLayoutShell title="Admin Command Center">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Operators management */}
        <div className="lg:col-span-2 space-y-4">
          <Card title="Operator Accounts" subtitle="Manage logins for milk loaders and cashiers">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {operators.map(op => (
                <div key={op.id} className="py-3.5 flex justify-between items-center px-1 rounded-xl">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{op.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize">{op.email} • {op.role}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={op.status === 'active' ? 'secondary' : 'neutral'}>
                      {op.status}
                    </Badge>
                    <Button variant="outline" size="sm" className="p-1.5 rounded-lg hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Database log info */}
        <div>
          <Card title="System Diagnostics" subtitle="Security controls & platform logs">
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-xl flex gap-3 text-amber-800 dark:text-amber-400">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <div>
                  <h6 className="text-xs font-bold">Admin Console Warning</h6>
                  <p className="text-[10px] text-amber-700 dark:text-amber-500 mt-0.5">
                    Modifying system policies directly impacts standard collection rates and client invoices logs.
                  </p>
                </div>
              </div>
              
              <Button variant="outline" className="w-full gap-2 rounded-xl text-xs py-2.5">
                <Key className="w-4 h-4" /> Reset DB Connections
              </Button>
            </div>
          </Card>
        </div>

      </div>
    </DashboardLayoutShell>
  );
}
