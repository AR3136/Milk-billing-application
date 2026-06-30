// Reports feature types
export type ReportType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type ExportFormat = 'pdf' | 'excel' | 'csv';

export interface ReportFilters {
  type: ReportType;
  from_date: string;
  to_date: string;
  customer_id?: string;
}

export interface ReportData {
  summary: ReportSummary;
  entries: ReportEntry[];
}

export interface ReportSummary {
  total_quantity: number;
  total_amount: number;
  total_paid: number;
  total_pending: number;
  total_customers: number;
}

export interface ReportEntry {
  date: string;
  customer_name: string;
  quantity: number;
  rate: number;
  amount: number;
}
