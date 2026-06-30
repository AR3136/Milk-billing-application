import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getPayments, recordPayment, recordRefund, getCustomerTransactions } from '../services';
import { Payment, PaymentFormData } from '../types';

/**
 * Custom hook to retrieve payments history
 */
export function usePaymentsHistory(params: { customerId?: string; method?: string }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPayments({
        customerId: params.customerId,
        method: params.method || 'all',
      });
      setPayments(res);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load payments history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [params.customerId, params.method]);

  return {
    payments,
    loading,
    error,
    refresh: fetchList,
  };
}

/**
 * Custom hook to handle payment ledger transactions
 */
export function usePaymentActions() {
  const [isMutating, setIsMutating] = useState(false);

  const performAction = async (action: () => Promise<any>, successMsg: string) => {
    setIsMutating(true);
    try {
      const res = await action();
      toast.success(successMsg);
      return res;
    } catch (err: any) {
      toast.error(err.message || 'Operation failed.');
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  return {
    isMutating,
    recordPayment: (data: PaymentFormData) =>
      performAction(() => recordPayment(data), 'Payment recorded successfully.'),
    recordRefund: (data: { customerId: string; amount: number; reason: string }) =>
      performAction(() => recordRefund(data), 'Refund processed successfully.'),
  };
}
