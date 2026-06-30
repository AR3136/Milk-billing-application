// Billing feature types
export interface Bill {
  id: string;
  bill_number: string;
  customer_id: string;
  customer_name: string;
  from_date: string;
  to_date: string;
  total_quantity: number;
  total_amount: number;
  paid_amount: number;
  balance: number;
  balance_forward?: number;
  net_payable?: number;
  status: 'draft' | 'generated' | 'sent' | 'paid' | 'overdue';
  created_at: string;
}

export interface BillLineItem {
  id: string;
  bill_id: string;
  date: string;
  shift: 'morning' | 'evening';
  quantity: number;
  rate: number;
  amount: number;
}

export interface BillFilters {
  status?: string;
  customer_id?: string;
  from_date?: string;
  to_date?: string;
}
