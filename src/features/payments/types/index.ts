// Payment feature types
export interface Payment {
  id: string;
  customer_id: string;
  customer_name: string;
  bill_id?: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export interface PaymentFormData {
  customer_id: string;
  bill_id?: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  reference_number?: string;
  notes?: string;
}
