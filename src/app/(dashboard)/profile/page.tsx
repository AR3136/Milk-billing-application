'use client';

import React, { useState } from 'react';
import { DashboardLayoutShell } from '@/components/layout';
import { Card, Badge, Button, Input } from '@/components/ui';
import { User, Shield, Save, LogOut } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ProfilePage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    setIsSaving(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully!');
      form.reset();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  return (
    <DashboardLayoutShell title="My Profile">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Profile Card */}
        <div className="space-y-4">
          <Card className="flex flex-col items-center text-center p-6">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-full flex items-center justify-center font-bold text-white text-3xl shadow-lg mb-4">
              {initials}
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {currentUser?.name || 'Loading...'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 mb-3">
              {currentUser?.email || ''}
            </p>
            <Badge variant="primary" className="gap-1.5 capitalize">
              <Shield className="w-3 h-3" /> {currentUser?.role || 'operator'}
            </Badge>
          </Card>

          <Button
            variant="outline"
            className="w-full gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/30"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>

        {/* Account Details */}
        <div className="lg:col-span-2 space-y-4">
          <Card title="Account Information" subtitle="Your registered account details">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Full Name</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{currentUser?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Email</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{currentUser?.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Role</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 capitalize">{currentUser?.role || '—'}</span>
              </div>
            </div>
          </Card>

          <Card title="Change Password" subtitle="Update your login credentials">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <Input
                label="New Password"
                name="newPassword"
                type="password"
                placeholder="Min 6 characters"
                required
                disabled={isSaving}
              />
              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                placeholder="Repeat new password"
                required
                disabled={isSaving}
              />
              <Button type="submit" className="gap-2 rounded-xl" disabled={isSaving}>
                <Save className="w-4 h-4" />
                {isSaving ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </Card>
        </div>

      </div>
    </DashboardLayoutShell>
  );
}
