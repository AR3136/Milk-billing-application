import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import * as services from '../services';
import { Customer, CustomerFormData } from '../types';

/**
 * Custom hook to manage customer listing states, search queries, filters and pagination.
 */
export function useCustomersList(initialParams = {}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [params, setParams] = useState({
    search: '',
    milkType: 'all',
    status: 'active',
    page: 1,
    limit: 10,
    ...initialParams,
  });

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await services.getCustomers(params);
      setCustomers(res.data);
      setTotal(res.total);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load customers list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [params]);

  return {
    customers,
    total,
    loading,
    error,
    params,
    setParams,
    refresh: fetchList,
  };
}

/**
 * Custom hook for Customer mutating actions (Create, Update, Archive, Delete).
 * Triggers loading overlays, error notifications, and throw toast messages on complete.
 */
export function useCustomerMutations() {
  const [isMutating, setIsMutating] = useState(false);

  const performAction = async (action: () => Promise<any>, successMsg: string) => {
    setIsMutating(true);
    try {
      const result = await action();
      toast.success(successMsg);
      return result;
    } catch (error: any) {
      toast.error(error.message || 'Operation failed.');
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  return {
    isMutating,
    createCustomer: (data: CustomerFormData) => 
      performAction(() => services.createCustomer(data), 'Customer registered successfully.'),
    updateCustomer: (id: string, data: Partial<CustomerFormData & { is_active: boolean }>) => 
      performAction(() => services.updateCustomer(id, data), 'Customer updated successfully.'),
    archiveCustomer: (id: string) => 
      performAction(() => services.archiveCustomer(id), 'Customer account archived.'),
    deleteCustomer: (id: string) => 
      performAction(() => services.deleteCustomer(id), 'Customer deleted successfully.'),
  };
}
