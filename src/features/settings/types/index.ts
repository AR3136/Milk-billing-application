// Settings feature types
export interface AppSettings {
  business_name: string;
  business_phone: string;
  business_address: string;
  default_milk_rate_cow: number;
  default_milk_rate_buffalo: number;
  billing_cycle: 'weekly' | 'biweekly' | 'monthly';
  currency: string;
  date_format: string;
  enable_fat_snf: boolean;
  enable_notifications: boolean;
}

export interface RateConfig {
  id: string;
  milk_type: 'cow' | 'buffalo' | 'mixed';
  rate_per_liter: number;
  effective_from: string;
  effective_to?: string;
}
