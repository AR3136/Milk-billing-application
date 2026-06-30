import { createClient } from '@/lib/supabase/client';
import { Customer, CustomerFormData } from '../types';

/**
 * Supabase client queries for Customer Management
 */

// 1. Fetch paginated customers matching constraints
export async function getCustomers({
  search = '',
  milkType = 'all',
  status = 'active',
  page = 1,
  limit = 10,
}) {
  const supabase = createClient();
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' });

  // Handle active/archived soft-delete state
  if (status === 'active') {
    query = query.is('deleted_at', null).eq('is_active', true);
  } else if (status === 'archived') {
    query = query.is('deleted_at', null).eq('is_active', false);
  } else {
    query = query.is('deleted_at', null);
  }

  if (milkType !== 'all') {
    query = query.eq('milk_type', milkType);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, count, error } = await query
    .order('name', { ascending: true })
    .range(start, end);

  if (error) throw error;
  return {
    data: data as unknown as Customer[],
    total: count || 0,
    page,
    limit,
  };
}

// 2. Create customer
export async function createCustomer(data: CustomerFormData) {
  const supabase = createClient();
  const { data: newCust, error } = await supabase
    .from('customers')
    .insert([
      {
        name: data.name,
        phone: data.phone,
        address: data.address,
        milk_type: data.milk_type,
        default_quantity: data.default_quantity,
        rate_per_liter: data.rate_per_liter,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return newCust;
}

// 3. Update customer
export async function updateCustomer(id: string, data: Partial<CustomerFormData & { is_active: boolean }>) {
  const supabase = createClient();
  const { data: updatedCust, error } = await supabase
    .from('customers')
    .update({
      name: data.name,
      phone: data.phone,
      address: data.address,
      milk_type: data.milk_type,
      default_quantity: data.default_quantity,
      rate_per_liter: data.rate_per_liter,
      is_active: data.is_active,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return updatedCust;
}

// 4. Soft Delete (Archive) Customer
export async function archiveCustomer(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('customers')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

// 5. Hard Delete Customer record
export async function deleteCustomer(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('customers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// 6. Get detailed history log (deliveries + payments)
export async function getCustomerLedgerHistory(customerId: string) {
  const supabase = createClient();

  const [milkResult, paymentResult] = await Promise.all([
    supabase
      .from('milk_entries')
      .select('*')
      .eq('customer_id', customerId)
      .is('deleted_at', null)
      .order('date', { ascending: false }),
    supabase
      .from('payments')
      .select('*')
      .eq('customer_id', customerId)
      .is('deleted_at', null)
      .order('payment_date', { ascending: false }),
  ]);

  if (milkResult.error) throw milkResult.error;
  if (paymentResult.error) throw paymentResult.error;

  return {
    milkEntries: milkResult.data,
    payments: paymentResult.data,
  };
}

// 7. Upload photo avatar to Storage Bucket
export async function uploadAvatar(customerId: string, file: File) {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const filePath = `avatars/${customerId}-${Math.random()}.${fileExt}`;

  // Upload to bucket 'customer-photos'
  const { error: uploadError } = await supabase.storage
    .from('customer-photos')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('customer-photos')
    .getPublicUrl(filePath);

  // Update customer row
  const { error: dbError } = await supabase
     .from('customers')
     .update({ address: publicUrl }) // Mock update storing public url inside address or metadata
     .eq('id', customerId);

  if (dbError) throw dbError;

  return publicUrl;
}
