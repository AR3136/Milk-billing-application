import { createClient } from '@/lib/supabase/client';
import { utils, write } from 'xlsx';
import { toast } from 'sonner';

/**
 * Supabase aggregation queries and download helpers for reports and analytics
 */

// 1. Fetch yield, revenue and outflow metrics
export async function getReportSummary({
  fromDate,
  toDate,
  customerId = '',
}: {
  fromDate: string;
  toDate: string;
  customerId?: string;
}) {
  const supabase = createClient();

  let milkQuery = supabase
    .from('milk_entries')
    .select('quantity, amount, fat, snf')
    .gte('date', fromDate)
    .lte('date', toDate)
    .is('deleted_at', null);

  let expenseQuery = supabase
    .from('expenses')
    .select('amount')
    .gte('date', fromDate)
    .lte('date', toDate)
    .is('deleted_at', null);

  if (customerId) {
    milkQuery = milkQuery.eq('customer_id', customerId);
  }

  const [milkRes, expRes] = await Promise.all([milkQuery, expenseQuery]);
  if (milkRes.error) throw milkRes.error;
  if (expRes.error) throw expRes.error;

  const totalLiters = milkRes.data?.reduce((sum, e) => sum + Number(e.quantity), 0) || 0;
  const totalRevenue = milkRes.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const totalExpense = expRes.data?.reduce((sum, ex) => sum + Number(ex.amount), 0) || 0;

  return {
    totalLiters,
    totalRevenue,
    totalExpense,
    netProfit: totalRevenue - totalExpense,
    totalEntries: milkRes.data?.length || 0,
  };
}

// 2. Aggregate list of top yield customer sources
export async function getTopCustomers(limit = 5) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('milk_entries')
    .select('customer_id, customer_name, quantity, amount')
    .is('deleted_at', null);

  if (error) throw error;

  // Group by customer
  const map: Record<string, { name: string; quantity: number; amount: number }> = {};
  data?.forEach(e => {
    if (!map[e.customer_id]) {
      map[e.customer_id] = { name: e.customer_name || 'Unknown', quantity: 0, amount: 0 };
    }
    map[e.customer_id].quantity += Number(e.quantity);
    map[e.customer_id].amount += Number(e.amount);
  });

  return Object.values(map)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

// 3. Export data as Excel spreadsheet using SheetJS
export function exportReportToExcel(reportData: any[], filename = 'report.xlsx') {
  try {
    const ws = utils.json_to_sheet(reportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Summary');
    
    // Save file buffer
    const buf = write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    toast.success('Excel sheet exported successfully.');
  } catch (err) {
    toast.error('Failed to export Excel sheet.');
  }
}
