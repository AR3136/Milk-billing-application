// Admin feature types
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator';
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface AdminUserFormData {
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator';
  password?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, unknown>;
  created_at: string;
}
