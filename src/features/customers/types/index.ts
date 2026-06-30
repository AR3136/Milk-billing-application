// Customer feature types
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  milk_type: 'cow' | 'buffalo' | 'mixed';
  default_quantity: number;
  rate_per_liter: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
  name: string;
  phone: string;
  address?: string;
  milk_type: 'cow' | 'buffalo' | 'mixed';
  default_quantity: number;
  rate_per_liter: number;
}

export interface CustomerFilters {
  search?: string;
  milk_type?: string;
  is_active?: boolean;
}
