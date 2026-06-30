import { createClient } from '@/lib/supabase/client';
import { AdminUser, AuditLog } from '../types';

/**
 * Supabase client actions for administrative console, operators, and audit logs
 */

// 1. Fetch registered operators
export async function getAdminUsers() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .is('deleted_at', null);

  if (error) throw error;
  return data as unknown as AdminUser[];
}

// 2. Modify operator role permissions configurations
export async function updateAdminUserRole(userId: string, role: 'owner' | 'admin' | 'manager' | 'employee') {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 3. Fetch security audit logs history
export async function getAuditLogs(limit = 50) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as unknown as AuditLog[];
}

// 4. Retrieve diagnostic stats summary
export async function getPlatformDiagnosticStats() {
  const supabase = createClient();

  const [custRes, entryRes, logRes] = await Promise.all([
    supabase.from('customers').select('id', { count: 'exact' }).is('deleted_at', null),
    supabase.from('milk_entries').select('id', { count: 'exact' }).is('deleted_at', null),
    supabase.from('audit_logs').select('id', { count: 'exact' })
  ]);

  return {
    customerCount: custRes.count || 0,
    entriesCount: entryRes.count || 0,
    auditLogsCount: logRes.count || 0,
    systemLoad: '0.04 ms',
  };
}
