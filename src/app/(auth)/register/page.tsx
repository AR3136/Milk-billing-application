'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Milk } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'admin' | 'manager' | 'operator'>('operator');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = (data.get('name') as string)?.trim();
    const email = (data.get('email') as string)?.trim();
    const password = data.get('password') as string;
    const confirmPassword = data.get('confirmPassword') as string;

    if (!name || !email || !password) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    try {
      const { data: resData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      // If session is returned immediately → email confirm is OFF → go to dashboard
      if (resData.session) {
        toast.success(`Welcome, ${name}! Your account has been created.`);
        router.refresh();
        router.push('/dashboard');
      } else {
        // Email confirmation is ON
        toast.success('Account created! Please check your email to confirm your account before signing in.');
        router.push('/login');
      }
    } catch (err: any) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 md:p-10 shadow-2xl relative overflow-hidden">
      <div className="flex flex-col items-center text-center space-y-3 mb-6">
        <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
          <Milk className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Create Account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            Set up your dairy management access profile
          </p>
        </div>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          name="name"
          placeholder="e.g. Ramesh Kumar"
          required
          disabled={isLoading}
          autoComplete="name"
        />
        <Input
          label="Email Address"
          type="email"
          name="email"
          placeholder="you@example.com"
          required
          disabled={isLoading}
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="Min 6 characters"
          required
          disabled={isLoading}
          autoComplete="new-password"
        />
        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          placeholder="Repeat your password"
          required
          disabled={isLoading}
          autoComplete="new-password"
        />

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Access Role</label>
          <select
            className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            value={role}
            onChange={e => setRole(e.target.value as any)}
            disabled={isLoading}
          >
            <option value="admin">Admin — Full system access</option>
            <option value="manager">Bill Manager — Billing & ledgers</option>
            <option value="operator">Operator — Milk entries only</option>
          </select>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="w-full gap-2 rounded-2xl py-3 text-sm font-bold shadow-md shadow-blue-200"
        >
          <UserPlus className="w-4 h-4" />
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <div className="text-center mt-6 text-xs text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline font-bold">
          Sign In
        </Link>
      </div>
    </div>
  );
}
