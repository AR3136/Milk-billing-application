import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { LoginCredentials, PhoneOTPCredentials } from '../types';

/**
 * Authentication service using Supabase browser actions
 */

// 1. Email and Password Authentication
export async function signInWithEmail({ email, password }: Required<Omit<LoginCredentials, 'rememberMe'>>) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// 2. Phone OTP Request SMS dispatch
export async function requestPhoneOTP(phone: string) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) throw error;
  return data;
}

// 3. Verify SMS Token
export async function verifyPhoneOTP({ phone, otp }: Required<PhoneOTPCredentials>) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: otp,
    type: 'sms',
  });

  if (error) throw error;
  return data;
}

// 4. Send reset password link for email
export async function sendPasswordResetEmail(email: string) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
  return data;
}

// 5. User Logout
export async function secureLogout() {
  const supabase = createBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// 6. Get Current User and Roles
export async function getCurrentSessionUser() {
  const supabase = createBrowserClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}
