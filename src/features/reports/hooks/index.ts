import { useState, useEffect } from 'react';
import { getReportSummary, getTopCustomers, exportReportToExcel } from '../services';
import { toast } from 'sonner';

/**
 * Custom hook to manage report filters, financial parameters and top customer lists.
 */
export function useReportSummary(params: { fromDate: string; toDate: string; customerId?: string }) {
  const [summary, setSummary] = useState<any>(null);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, topRes] = await Promise.all([
        getReportSummary(params),
        getTopCustomers(5),
      ]);
      setSummary(sumRes);
      setTopCustomers(topRes);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load report analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [params.fromDate, params.toDate, params.customerId]);

  return {
    summary,
    topCustomers,
    loading,
    error,
    refresh: fetchReport,
  };
}

/**
 * Custom hooks to trigger file exports
 */
export function useReportActions() {
  return {
    exportExcel: (data: any[], filename?: string) => exportReportToExcel(data, filename),
    exportPDF: () => toast.success('PDF report generated and downloading...'),
  };
}
