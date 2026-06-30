import { createClient } from '@/lib/supabase/client';
import { Bill } from '../types';

/**
 * Supabase database operations and ledger generators for invoice cycles
 */

// 1. Fetch generated bills list
export async function getBills({
  customerId = '',
  status = 'all',
}) {
  const supabase = createClient();
  let query = supabase
    .from('bills')
    .select('*')
    .is('deleted_at', null);

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }
  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data as unknown as Bill[];
}

// 2. Generate new invoice summary metrics based on date range deliveries
export async function generateBill({
  customerId,
  fromDate,
  toDate,
}: {
  customerId: string;
  fromDate: string;
  toDate: string;
}) {
  const supabase = createClient();

  // Fetch unbilled entries for the range
  const { data: entries, error: entriesError } = await supabase
    .from('milk_entries')
    .select('*')
    .eq('customer_id', customerId)
    .gte('date', fromDate)
    .lte('date', toDate)
    .is('deleted_at', null);

  if (entriesError) throw entriesError;

  // Fetch customer details for rates configuration
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (customerError) throw customerError;

  // Compute metrics
  const totalLiters = entries?.reduce((sum, e) => sum + Number(e.quantity), 0) || 0;
  const totalAmount = entries?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  
  const fatEntries = entries?.filter(e => e.fat !== null) || [];
  const avgFat = fatEntries.length > 0 ? fatEntries.reduce((sum, e) => sum + Number(e.fat), 0) / fatEntries.length : 0;

  const snfEntries = entries?.filter(e => e.snf !== null) || [];
  const avgSnf = snfEntries.length > 0 ? snfEntries.reduce((sum, e) => sum + Number(e.snf), 0) / snfEntries.length : 0;

  const billNumber = `INV-${Date.now()}`;
  const balanceForward = customer.default_quantity * 30; // Mock mapping balance dues

  const { data: bill, error: billError } = await supabase
    .from('bills')
    .insert([
      {
        bill_number: billNumber,
        customer_id: customerId,
        from_date: fromDate,
        to_date: toDate,
        total_quantity: totalLiters,
        total_amount: totalAmount,
        balance_forward: balanceForward,
        net_payable: totalAmount + balanceForward,
        status: 'generated',
      },
    ])
    .select()
    .single();

  if (billError) throw billError;

  // Associate line items
  if (entries && entries.length > 0) {
    const items = entries.map(e => ({
      bill_id: bill.id,
      milk_entry_id: e.id,
      quantity: e.quantity,
      rate: e.rate_applied,
      amount: e.amount
    }));

    const { error: itemsError } = await supabase
      .from('bill_line_items')
      .insert(items);

    if (itemsError) throw itemsError;
  }

  return bill;
}

// 3. Update invoice payment statuses
export async function updateBillStatus(id: string, status: 'draft' | 'generated' | 'sent' | 'paid' | 'overdue') {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bills')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 4. Formatting prefilled WhatsApp template links
export function formatWhatsAppShareLink(bill: Bill, customerPhone: string) {
  let greetingPrefix = 'Hello';
  let thankYouSuffix = 'Please clear the dues. Thank you!';

  if (typeof window !== 'undefined') {
    greetingPrefix = localStorage.getItem('whatsapp_greeting') || 'Hello';
    thankYouSuffix = localStorage.getItem('whatsapp_thankyou') || 'Please clear the dues. Thank you!';
  }

  const avgRate = bill.total_quantity > 0 ? (bill.total_amount / bill.total_quantity).toFixed(2) : '0.00';

  const message = `${greetingPrefix} ${bill.customer_name},\n\n` +
    `*GANGA DAIRY FARM INVOICE*\n` +
    `---------------------------------\n` +
    `Invoice No: ${bill.bill_number}\n` +
    `Customer: ${bill.customer_name}\n` +
    `Billing Cycle: ${bill.from_date} to ${bill.to_date}\n` +
    `---------------------------------\n` +
    `Milk Qty: ${bill.total_quantity} L\n` +
    `Avg Rate: ₹${avgRate}/L\n` +
    `Current Bill: ₹${bill.total_amount}\n` +
    `Balance Forward: ₹${bill.balance_forward || 0}\n` +
    `---------------------------------\n` +
    `*Net Payable: ₹${bill.net_payable || bill.total_amount}*\n` +
    `---------------------------------\n` +
    `${thankYouSuffix}`;

  const encodedText = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=91${customerPhone}&text=${encodedText}`;
}
export { formatWhatsAppShareLink as getWhatsAppShareLink };
