// Dashboard feature types
export interface DashboardStats {
  totalCustomers: number;
  totalMilkToday: number;
  totalRevenue: number;
  pendingPayments: number;
}

export interface DashboardChartData {
  date: string;
  quantity: number;
  revenue: number;
}

export interface RecentActivity {
  id: string;
  type: 'milk_entry' | 'payment' | 'bill' | 'customer';
  description: string;
  timestamp: string;
}
