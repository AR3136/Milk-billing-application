import { createClient } from '@/lib/supabase/client';
import { AppSettings } from '../types';

/**
 * Supabase client actions and helper utilities for settings configurations
 */

// 1. Fetch settings keys
export async function getSettings() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('settings')
    .select('*');

  if (error) throw error;
  
  // Transform key-value rows to settings object
  const settings: Record<string, any> = {};
  data?.forEach(row => {
    settings[row.key] = row.value;
  });

  return settings as unknown as AppSettings;
}

// 2. Save settings key-values
export async function saveSettings(settings: Partial<AppSettings>) {
  const supabase = createClient();
  const payload = Object.keys(settings).map(key => ({
    key,
    value: String((settings as any)[key]),
    updated_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('settings')
    .upsert(payload, { onConflict: 'key' })
    .select();

  if (error) throw error;
  return data;
}

// 3. Generate dynamic UPI payment QR links
export function generateUPIQRLink({
  upiId,
  payeeName,
  amount,
  invoiceNumber,
}: {
  upiId: string;
  payeeName: string;
  amount: number;
  invoiceNumber: string;
}) {
  const formattedName = encodeURIComponent(payeeName);
  const formattedRef = encodeURIComponent(invoiceNumber);
  
  // Standard UPI URI scheme
  const upiUrl = `upi://pay?pa=${upiId}&pn=${formattedName}&am=${amount}&cu=INR&tn=${formattedRef}`;
  
  // Render UPI QR using standard Google Chart API
  return `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(upiUrl)}&choe=UTF-8`;
}

// 4. Download backup dump trigger
export async function downloadDatabaseBackup() {
  const supabase = createClient();
  
  // Fetch summaries from key tables to compile backup JSON
  const [custRes, entryRes, payRes] = await Promise.all([
    supabase.from('customers').select('*').is('deleted_at', null),
    supabase.from('milk_entries').select('*').is('deleted_at', null),
    supabase.from('payments').select('*').is('deleted_at', null)
  ]);

  if (custRes.error) throw custRes.error;
  
  const backupData = {
    version: '1.0.0',
    exported_at: new Date().toISOString(),
    customers: custRes.data || [],
    milkEntries: entryRes.data || [],
    payments: payRes.data || []
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dairy-backup-${Date.now()}.json`;
  link.click();
}
export { generateUPIQRLink as getUPIQRCodeLink };
