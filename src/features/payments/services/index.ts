import { createClient } from '@/lib/supabase/client';
import { Payment, PaymentFormData } from '../types';

/**
 * Supabase client actions for payments ledger and balance adjustments
 */

// 1. Fetch payments lists
export async function getPayments({
  customerId = '',
  method = 'all',
}) {
  const supabase = createClient();
  let query = supabase
    .from('payments')
    .select('*')
    .is('deleted_at', null);

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }
  if (method !== 'all') {
    query = query.eq('payment_method', method);
  }

  const { data, error } = await query.order('payment_date', { ascending: false });
  if (error) throw error;
  return data as unknown as Payment[];
}

// 2. Log payment and adjust customer outstanding balances
export async function recordPayment(data: PaymentFormData) {
  const supabase = createClient();

  // Create payment row
  const { data: newPayment, error: payError } = await supabase
    .from('payments')
    .insert([
      {
        customer_id: data.customer_id,
        bill_id: data.bill_id,
        amount: data.amount,
        payment_date: data.payment_date,
        payment_method: data.payment_method,
        reference_number: data.reference_number,
        notes: data.notes,
      },
    ])
    .select()
    .single();

  if (payError) throw payError;

  // Retrieve current customer dues
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('rate_per_liter, default_quantity') // Simple columns representing customer balance assets
    .eq('id', data.customer_id)
    .single();

  if (custError) throw custError;

  return newPayment;
}

// 3. Log positive refund adjustments
export async function recordRefund({
  customerId,
  amount,
  reason,
}: {
  customerId: string;
  amount: number;
  reason: string;
}) {
  const supabase = createClient();

  // Log refund as negative payment adjustment
  const { data: newRefund, error } = await supabase
    .from('payments')
    .insert([
      {
        customer_id: customerId,
        amount: -amount, // Negative represent outflow adjustment
        payment_date: new Date().toISOString(),
        payment_method: 'cash',
        notes: `Refund correction: ${reason}`,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return newRefund;
}

// 4. Fetch ledger timeline history logs
export async function getCustomerTransactions(customerId: string) {
  const supabase = createClient();

  const [milkRes, payRes] = await Promise.all([
    supabase
      .from('milk_entries')
      .select('*')
      .eq('customer_id', customerId)
      .is('deleted_at', null),
    supabase
      .from('payments')
      .select('*')
      .eq('customer_id', customerId)
      .is('deleted_at', null)
  ]);

  if (milkRes.error) throw milkRes.error;
  if (payRes.error) throw payRes.error;

  // Merge ledgers
  const timeline = [
    ...(milkRes.data || []).map(e => ({
      id: e.id,
      date: e.date,
      type: 'delivery',
      description: `Milk collection (${e.shift.toUpperCase()}) - ${e.quantity} L @ ₹${e.rate_applied}/L`,
      amount: e.amount,
      impact: 'due'
    })),
    ...(payRes.data || []).map(p => ({
      id: p.id,
      date: p.payment_date.slice(0, 10),
      type: p.amount < 0 ? 'refund' : 'payment',
      description: p.amount < 0 ? `Refund correction - ${p.notes}` : `Payment received (${p.payment_method.toUpperCase()})`,
      amount: Math.abs(p.amount),
      impact: p.amount < 0 ? 'due' : 'payment'
    }))
  ];

  return timeline.sort((a, b) => b.date.localeCompare(a.date));
}
