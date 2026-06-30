import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your Milk Billing System password',
};

/**
 * Forgot Password Page
 * TODO: Implement ForgotPasswordForm component from features/auth
 */
export default function ForgotPasswordPage() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl">
      <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
      <p className="mt-2 text-sm text-gray-500">Enter your email to receive a reset link</p>
      {/* TODO: <ForgotPasswordForm /> */}
    </div>
  );
}
