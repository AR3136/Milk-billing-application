import React from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { AdminUser, AuditLog } from '../types';
import { Shield, ShieldAlert, Users, Trash2, Key, ToggleRight } from 'lucide-react';

interface OperatorTableProps {
  users: AdminUser[];
  onRoleChange: (userId: string, role: any) => void;
  isLoading?: boolean;
}

/**
 * Grid-view managing system logins, credentials and operators roles
 */
export const OperatorTable: React.FC<OperatorTableProps> = ({ users, onRoleChange, isLoading = false }) => {
  return (
    <Card title="Operator Accounts" subtitle="Manage logins and role permissions for dairy staff">
      <div className="overflow-x-auto text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 dark:text-slate-400 uppercase font-semibold">
              <th className="py-2.5 px-3">Name</th>
              <th className="py-2.5 px-3">Email</th>
              <th className="py-2.5 px-3">Permission Access</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-3 font-semibold text-slate-700">{u.name}</td>
                <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-medium">{u.email}</td>
                <td className="py-3 px-3">
                  <select 
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    value={u.role}
                    onChange={e => onRoleChange(u.id, e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                  </select>
                </td>
                <td className="py-3 px-3 text-right">
                  <Badge variant={u.is_active ? 'secondary' : 'neutral'}>
                    {u.is_active ? 'Active' : 'Suspended'}
                  </Badge>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500 dark:text-slate-400">No operator accounts found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

interface AuditLogTimelineProps {
  logs: AuditLog[];
}

/**
 * Log card tracking system modifications
 */
export const AuditLogTimeline: React.FC<AuditLogTimelineProps> = ({ logs }) => {
  return (
    <Card title="System Activity Audit Log" subtitle="Timeline of database actions and metadata changes">
      <div className="space-y-3.5 max-h-96 overflow-y-auto text-xs pr-2">
        {logs.map((log, idx) => (
          <div 
            key={log.id || idx} 
            className="flex justify-between items-start p-3 bg-slate-50 border border-slate-100 rounded-xl"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="neutral" className="text-[9px] uppercase tracking-wide">
                  {log.action}
                </Badge>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{log.created_at?.slice(11, 19) || 'Just now'}</span>
              </div>
              <p className="text-slate-600 font-semibold">Table: {log.table_name} • Record: {log.record_id?.slice(0, 8)}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{log.user_name || 'Admin'}</span>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">No system actions logged yet.</p>
        )}
      </div>
    </Card>
  );
};
export { OperatorTable as default };
