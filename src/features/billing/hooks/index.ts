import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getBills, generateBill, updateBillStatus } from '../services';
import { Bill } from '../types';

/**
 * Custom hook to fetch all bills with filters
 */
export function useBillsList(params: { customerId?: string; status?: string }) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBills({
        customerId: params.customerId,
        status: params.status || 'all',
      });
      setBills(res);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load bills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [params.customerId, params.status]);

  return {
    bills,
    loading,
    error,
    refresh: fetchList,
  };
}

/**
 * Custom hooks managing mutations and actions
 */
export function useBillOperations() {
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
    generateBill: (data: { customerId: string; fromDate: string; toDate: string }) =>
      performAction(() => generateBill(data), 'Invoice generated successfully.'),
    updateStatus: (id: string, status: 'draft' | 'generated' | 'sent' | 'paid' | 'overdue') =>
      performAction(() => updateBillStatus(id, status), `Bill updated status to ${status}.`),
  };
}
