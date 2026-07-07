'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Milk } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = (data.get('email') as string)?.trim();
    const password = data.get('password') as string;

    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          toast.error('Please confirm your email address before logging in. Check your inbox.');
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('Incorrect email or password. Please try again.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Welcome back!');
      router.refresh();
      router.push('/dashboard');
    } catch (err: any) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 md:p-10 shadow-2xl relative overflow-hidden">
      <div className="flex flex-col items-center text-center space-y-3 mb-8">

        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            DairyLedger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            Sign in to manage your dairy operations, billing, and customers
          </p>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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
          placeholder="Enter your password"
          required
          disabled={isLoading}
          autoComplete="current-password"
        />

        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-semibold py-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" /> Remember me
          </label>
          <Link href="/forgot-password" className="hover:text-blue-600 transition-colors">Forgot Password?</Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="w-full gap-2 rounded-2xl py-3 text-sm font-bold shadow-md shadow-blue-200"
        >
          <LogIn className="w-4 h-4" />
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center mt-6 text-xs text-slate-500 dark:text-slate-400">
        Don't have an account?{' '}
        <Link href="/register" className="text-blue-600 hover:underline font-bold">
          Create Account
        </Link>
      </div>
    </div>
  );
}
