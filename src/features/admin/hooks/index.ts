import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getAdminUsers, updateAdminUserRole, getAuditLogs, getPlatformDiagnosticStats } from '../services';
import { AdminUser, AuditLog } from '../types';

/**
 * Custom hook retrieving diagnostic parameters, log data feeds and operator lists
 */
export function useAdminPanelData() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPanelData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, logRes, statsRes] = await Promise.all([
        getAdminUsers(),
        getAuditLogs(30),
        getPlatformDiagnosticStats()
      ]);
      setUsers(userRes);
      setAuditLogs(logRes);
      setStats(statsRes);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load administrative panel data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPanelData();
  }, []);

  return {
    users,
    auditLogs,
    stats,
    loading,
    error,
    refresh: fetchPanelData,
  };
}

/**
 * Custom hooks managing mutations and settings
 */
export function useAdminMutations() {
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
    updateUserRole: (id: string, role: 'owner' | 'admin' | 'manager' | 'employee') =>
      performAction(() => updateAdminUserRole(id, role), `User role updated successfully to ${role}.`),
  };
}
