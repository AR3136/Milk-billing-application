// Milk Entry feature types
export interface MilkEntry {
  id: string;
  customer_id: string;
  customer_name: string;
  date: string;
  shift: 'morning' | 'evening';
  quantity: number;
  fat?: number;
  snf?: number;
  rate: number;
  amount: number;
  created_at: string;
}

export interface MilkEntryFormData {
  customer_id: string;
  date: string;
  shift: 'morning' | 'evening';
  quantity: number;
  fat?: number;
  snf?: number;
  rate: number;
}

export interface MilkEntryFilters {
  date?: string;
  shift?: 'morning' | 'evening';
  customer_id?: string;
}
