import React from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { BarChart3, TrendingUp, Sparkles, FileText, Download, Award } from 'lucide-react';

interface MetricsSummaryProps {
  liters: number;
  revenue: number;
  expenses: number;
  netProfit: number;
}

/**
 * Display grid representing key financial metrics
 */
export const MetricsSummary: React.FC<MetricsSummaryProps> = ({
  liters,
  revenue,
  expenses,
  netProfit,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
      <Card className="border-l-4 border-l-blue-500">
        <p className="font-bold uppercase text-slate-500 dark:text-slate-400">Milk Quantity (L)</p>
        <h3 className="text-xl font-bold mt-1 text-slate-700">{liters.toFixed(1)} L</h3>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Total yield logged</p>
      </Card>
      <Card className="border-l-4 border-l-emerald-500">
        <p className="font-bold uppercase text-slate-500 dark:text-slate-400">Total Revenue</p>
        <h3 className="text-xl font-bold mt-1 text-emerald-600">₹{revenue.toFixed(2)}</h3>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Earnings before deductions</p>
      </Card>
      <Card className="border-l-4 border-l-rose-500">
        <p className="font-bold uppercase text-slate-500 dark:text-slate-400">Total Outflow</p>
        <h3 className="text-xl font-bold mt-1 text-rose-600">₹{expenses.toFixed(2)}</h3>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Feed, salary and operations costs</p>
      </Card>
      <Card className="border-l-4 border-l-amber-500">
        <p className="font-bold uppercase text-slate-500 dark:text-slate-400">Net Profits</p>
        <h3 className="text-xl font-bold mt-1 text-slate-800">₹{netProfit.toFixed(2)}</h3>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Revenue minus expenses</p>
      </Card>
    </div>
  );
};

interface TopCustomersProps {
  customers: any[];
}

/**
 * Leaderboard card highlighting top delivery suppliers
 */
export const TopCustomersCard: React.FC<TopCustomersProps> = ({ customers }) => {
  return (
    <Card title="Top Delivery Sources" subtitle="Highlighting highest volume dairy contributors">
      <div className="space-y-3.5 text-xs">
        {customers.map((c, idx) => (
          <div 
            key={c.id || idx} 
            className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl hover:translate-x-1 duration-200"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                {idx + 1}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{c.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Total yield: {c.quantity} L</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-800">₹{c.amount}</p>
              <Badge variant="secondary" className="mt-0.5 text-[9px] py-0 px-1 border-none bg-emerald-100/50">Top Supplier</Badge>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <p className="text-center text-slate-500 dark:text-slate-400 py-6">No yield stats found.</p>
        )}
      </div>
    </Card>
  );
};

interface ChartMockupProps {
  totalQuantity: number;
}

/**
 * Custom mockup dashboard component representing reports chart layout
 */
export const ReportChartCard: React.FC<ChartMockupProps> = ({ totalQuantity }) => {
  return (
    <Card title="Deliveries Volume Trend" subtitle="Daily collections quantity fluctuations">
      <div className="p-8 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-center items-center h-64 text-center text-xs">
        <BarChart3 className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
        <p className="font-bold text-slate-600">Dynamic Recharts Panel</p>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-1">
          Displays yield volumes trends. Total logged volume: {totalQuantity} L.
        </p>
      </div>
    </Card>
  );
};
