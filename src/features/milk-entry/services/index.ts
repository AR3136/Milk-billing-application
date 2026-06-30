import { createClient } from '@/lib/supabase/client';
import { MilkEntry, MilkEntryFormData } from '../types';

/**
 * Supabase client actions and pricing logic for Daily Milk Entries
 */

// 1. Calculate pricing rate based on Fat/SNF metrics and standard templates
export function calculateRate(params: {
  baseRate: number;
  milkType: 'cow' | 'buffalo' | 'mixed';
  fat?: number;
  snf?: number;
}) {
  const { baseRate, milkType, fat, snf } = params;
  
  // Pricing rules
  const stdFat = milkType === 'buffalo' ? 6.0 : 3.5;
  const stdSnf = milkType === 'buffalo' ? 9.0 : 8.5;
  const fatFactor = milkType === 'buffalo' ? 3.0 : 2.0; // Price adjustment per unit deviation
  const snfFactor = milkType === 'buffalo' ? 4.0 : 2.5;

  let finalRate = baseRate;

  if (fat !== undefined) {
    finalRate += (fat - stdFat) * fatFactor;
  }
  if (snf !== undefined) {
    finalRate += (snf - stdSnf) * snfFactor;
  }

  // Ensure price doesn't drop below operational threshold
  return Math.max(finalRate, 20.0);
}

// 2. Fetch log entries for specific day, shift and query parameters
export async function getMilkEntries({
  date = '',
  shift = 'all',
  customerId = '',
}) {
  const supabase = createClient();
  let query = supabase
    .from('milk_entries')
    .select('*')
    .is('deleted_at', null);

  if (date) {
    query = query.eq('date', date);
  }
  if (shift !== 'all') {
    query = query.eq('shift', shift);
  }
  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data as unknown as MilkEntry[];
}

// 3. Create entry row
export async function createMilkEntry(data: MilkEntryFormData & { rate_applied: number; amount: number }) {
  const supabase = createClient();
  const { data: newEntry, error } = await supabase
    .from('milk_entries')
    .insert([
      {
        customer_id: data.customer_id,
        date: data.date,
        shift: data.shift,
        quantity: data.quantity,
        fat: data.fat,
        snf: data.snf,
        rate_applied: data.rate_applied,
        amount: data.amount,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return newEntry;
}

// 4. Batch/Bulk upload Entries
export async function createMilkEntriesBulk(entries: Array<MilkEntryFormData & { rate_applied: number; amount: number }>) {
  const supabase = createClient();
  const payload = entries.map(e => ({
    customer_id: e.customer_id,
    date: e.date,
    shift: e.shift,
    quantity: e.quantity,
    fat: e.fat,
    snf: e.snf,
    rate_applied: e.rate_applied,
    amount: e.amount,
  }));

  const { data, error } = await supabase
    .from('milk_entries')
    .insert(payload)
    .select();

  if (error) throw error;
  return data;
}

// 5. Delete Entry
export async function deleteMilkEntry(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('milk_entries')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}
export { calculateRate as calculateEntryRate };
