'use client';

import React, { useState, useMemo } from 'react';
import { DashboardLayoutShell } from '@/components/layout';
import { Card, Badge, Button, Input } from '@/components/ui';
import { BarChart3, Download, Calendar, Users, TrendingUp, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const customers = useAppStore((state) => state.customers);
  const milkEntries = useAppStore((state) => state.milkEntries);
  const expenses = useAppStore((state) => state.expenses);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const startDate = useMemo(() => {
    const m = String(month).padStart(2, '0');
    return `${year}-${m}-01`;
  }, [month, year]);

  const endDate = useMemo(() => {
    const lastDay = new Date(year, month, 0).getDate();
    const m = String(month).padStart(2, '0');
    const d = String(lastDay).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }, [month, year]);

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  // Generate date array in selected range
  const dateRangeList = useMemo(() => {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return [];
    }

    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [startDate, endDate]);

  // Filter entries based on selected dates
  const filteredEntries = useMemo(() => {
    return milkEntries.filter(e => e.date >= startDate && e.date <= endDate);
  }, [milkEntries, startDate, endDate]);

  // Summary Metrics
  const totalLiters = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + e.quantity, 0);
  }, [filteredEntries]);

  const totalValue = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredEntries]);

  const totalExpense = useMemo(() => {
    return expenses
      .filter(ex => ex.date >= startDate && ex.date <= endDate)
      .reduce((sum, ex) => sum + ex.amount, 0);
  }, [expenses, startDate, endDate]);

  const netProfit = totalValue - totalExpense;

  const totalLitersCow = useMemo(() => {
    return filteredEntries
      .filter(e => e.milkType === 'cow' || e.milkType === 'mixed')
      .reduce((sum, e) => sum + e.quantity, 0);
  }, [filteredEntries]);

  const totalLitersBuffalo = useMemo(() => {
    return filteredEntries
      .filter(e => e.milkType === 'buffalo')
      .reduce((sum, e) => sum + e.quantity, 0);
  }, [filteredEntries]);

  // Build the vertical day-wise Excel sheet & trigger download
  const handleExportExcel = () => {
    if (dateRangeList.length === 0) {
      toast.error('Invalid date range. Please select valid dates.');
      return;
    }

    try {
      // 1. Build headers
      const headerRow1 = ['Date'];
      const headerRow2 = [''];
      const merges: any[] = [
        // Merge 'Date' vertically (row 0 to 1, column 0)
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }
      ];

      customers.forEach((cust, index) => {
        const colIdx = 1 + index * 2;
        headerRow1.push(cust.name, '');
        headerRow2.push('Cow', 'Buffalo');
        // Merge customer name horizontally (across Cow and Buffalo)
        merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + 1 } });
      });

      const totalColIdx = 1 + customers.length * 2;
      headerRow1.push('Total', '');
      headerRow2.push('Cow', 'Buffalo');
      // Merge Total horizontally
      merges.push({ s: { r: 0, c: totalColIdx }, e: { r: 0, c: totalColIdx + 1 } });

      const dataRows = [headerRow1, headerRow2];

      // 2. Build data rows day-wise
      dateRangeList.forEach((date) => {
        const dateLabel = new Date(date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        const row: any[] = [dateLabel];
        let totalCow = 0;
        let totalBuffalo = 0;

        customers.forEach((cust) => {
          const dayEntries = filteredEntries.filter(
            (e) => e.customerId === cust.id && e.date === date
          );
          
          const cowQty = dayEntries
            .filter(e => e.milkType === 'cow' || e.milkType === 'mixed')
            .reduce((sum, e) => sum + e.quantity, 0);
            
          const buffaloQty = dayEntries
            .filter(e => e.milkType === 'buffalo')
            .reduce((sum, e) => sum + e.quantity, 0);

          row.push(cowQty || 0);
          row.push(buffaloQty || 0);

          totalCow += cowQty;
          totalBuffalo += buffaloQty;
        });

        // Push totals
        row.push(totalCow);
        row.push(totalBuffalo);
        
        dataRows.push(row);
      });

      // 3. Build grand totals row
      const grandTotalRow: any[] = ['Grand Total'];
      customers.forEach((cust) => {
        const cowTotal = filteredEntries
          .filter(e => e.customerId === cust.id && (e.milkType === 'cow' || e.milkType === 'mixed'))
          .reduce((sum, e) => sum + e.quantity, 0);
        const buffaloTotal = filteredEntries
          .filter(e => e.customerId === cust.id && e.milkType === 'buffalo')
          .reduce((sum, e) => sum + e.quantity, 0);

        grandTotalRow.push(cowTotal, buffaloTotal);
      });

      grandTotalRow.push(totalLitersCow, totalLitersBuffalo);
      dataRows.push(grandTotalRow);

      const worksheet = XLSX.utils.aoa_to_sheet(dataRows);
      worksheet['!merges'] = merges;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vertical Yield Log');

      // Export file
      XLSX.writeFile(workbook, `Ganga_Dairy_Vertical_Report_${startDate}_to_${endDate}.xlsx`);
      toast.success('✓ Excel sheet downloaded successfully!');
    } catch (err: any) {
      toast.error('Failed to generate Excel sheet: ' + err.message);
    }
  };

  return (
    <DashboardLayoutShell title="Reports & Logbook Analytics">
      <div className="space-y-6">
        
        {/* Period Selector & Actions */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Month</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Year</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={handleExportExcel} disabled={customers.length === 0} className="gap-2 rounded-xl text-xs font-bold py-2.5">
            <Download className="w-4 h-4" /> Download Excel Sheet
          </Button>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <p className="text-xs uppercase text-slate-500 font-semibold">Total Yield Volume</p>
            <h3 className="text-xl font-bold mt-1">{totalLiters.toFixed(1)} L</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Total liters collected</p>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <p className="text-xs uppercase text-slate-500 font-semibold">Total Dues Value</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{totalValue.toFixed(2)}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Current cycle value</p>
          </Card>
          <Card className="border-l-4 border-l-rose-500">
            <p className="text-xs uppercase text-slate-500 font-semibold">Log Period Expenses</p>
            <h3 className="text-xl font-bold text-rose-600 mt-1">₹{totalExpense.toFixed(2)}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Feed, salaries and repairs</p>
          </Card>
          <Card className="border-l-4 border-l-violet-500">
            <p className="text-xs uppercase text-slate-500 font-semibold">Net Operating Balance</p>
            <h3 className={`text-xl font-bold mt-1 ${netProfit >= 0 ? 'text-violet-600' : 'text-rose-600'}`}>
              ₹{netProfit.toFixed(2)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Revenue minus expenses</p>
          </Card>
        </div>

        {/* Vertical Day-Wise Excel Like Sheet Grid */}
        <Card title="Vertical Collections Logbook Grid" subtitle="Scroll horizontally if you have many customers (missing collections default to 0 L)">
          {customers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No customer logs found in the database.
            </div>
          ) : dateRangeList.length === 0 ? (
            <div className="py-12 text-center text-rose-500 text-xs flex flex-col items-center gap-2">
              <ShieldAlert className="w-8 h-8" />
              <span>Invalid date range selected. Make sure the start date is before the end date.</span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl max-h-[500px]">
              <table className="w-full text-left border-collapse text-[10px] min-w-[500px]">
                <thead>
                  {/* Row 1: Merged Names */}
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-semibold sticky top-0 z-20">
                    <th rowSpan={2} className="py-2.5 px-2 w-20 sticky left-0 bg-slate-50 dark:bg-slate-900 border-r border-slate-250 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-middle">Date</th>
                    {customers.map(cust => (
                      <th key={cust.id} colSpan={2} className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800 text-[10px] font-bold truncate">
                        {cust.name}
                      </th>
                    ))}
                    <th colSpan={2} className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800 text-[10px] font-bold">
                      Total
                    </th>
                  </tr>
                  {/* Row 2: Sub-headers */}
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[8px] font-bold text-slate-500 uppercase">
                    {customers.map(cust => (
                      <React.Fragment key={`sub-${cust.id}`}>
                        <th className="py-1.5 px-1 text-center border-r border-slate-200 dark:border-slate-800 font-semibold w-12">Cow</th>
                        <th className="py-1.5 px-1 text-center border-r border-slate-200 dark:border-slate-800 font-semibold w-12">Buffalo</th>
                      </React.Fragment>
                    ))}
                    <th className="py-1.5 px-1 text-center border-r border-slate-200 dark:border-slate-800 font-semibold w-12 text-blue-600">Cow</th>
                    <th className="py-1.5 px-1 text-center border-r border-slate-200 dark:border-slate-800 font-semibold w-12 text-blue-600">Buffalo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                  {dateRangeList.map((date) => {
                    let totalCow = 0;
                    let totalBuffalo = 0;
                    const label = new Date(date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                    });
                    
                    return (
                      <tr key={date} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                        <td className="py-2 px-2 font-semibold text-slate-800 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          {label}
                        </td>
                        {customers.map((cust) => {
                          const dayEntries = filteredEntries.filter(
                            (e) => e.customerId === cust.id && e.date === date
                          );
                          const cowQty = dayEntries
                            .filter(e => e.milkType === 'cow' || e.milkType === 'mixed')
                            .reduce((sum, e) => sum + e.quantity, 0);
                          const buffaloQty = dayEntries
                            .filter(e => e.milkType === 'buffalo')
                            .reduce((sum, e) => sum + e.quantity, 0);

                          totalCow += cowQty;
                          totalBuffalo += buffaloQty;

                          return (
                            <React.Fragment key={`${cust.id}-${date}`}>
                              <td className="py-2 px-1 text-center border-r border-slate-200 dark:border-slate-800">
                                {cowQty > 0 ? (
                                  <span className="font-bold text-slate-905 dark:text-slate-100">{cowQty.toFixed(1)} L</span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-700">-</span>
                                )}
                              </td>
                              <td className="py-2 px-1 text-center border-r border-slate-200 dark:border-slate-800">
                                {buffaloQty > 0 ? (
                                  <span className="font-bold text-slate-905 dark:text-slate-100">{buffaloQty.toFixed(1)} L</span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-700">-</span>
                                )}
                              </td>
                            </React.Fragment>
                          );
                        })}
                        <td className="py-2 px-1 text-center font-extrabold text-blue-600 dark:text-blue-405 border-r border-slate-200 dark:border-slate-800">
                          {totalCow > 0 ? `${totalCow.toFixed(1)} L` : '-'}
                        </td>
                        <td className="py-2 px-1 text-center font-extrabold text-blue-600 dark:text-blue-405">
                          {totalBuffalo > 0 ? `${totalBuffalo.toFixed(1)} L` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-extrabold text-[10px]">
                  <tr className="bg-slate-50 dark:bg-slate-900">
                    <td className="py-2.5 px-2 sticky left-0 bg-slate-50 dark:bg-slate-900 border-r border-slate-250 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-slate-800 dark:text-slate-200 font-bold">
                      Total
                    </td>
                    {customers.map((cust) => {
                      const cowTotal = filteredEntries
                        .filter(e => e.customerId === cust.id && (e.milkType === 'cow' || e.milkType === 'mixed'))
                        .reduce((sum, e) => sum + e.quantity, 0);
                      const buffaloTotal = filteredEntries
                        .filter(e => e.customerId === cust.id && e.milkType === 'buffalo')
                        .reduce((sum, e) => sum + e.quantity, 0);
                        
                      return (
                        <React.Fragment key={`tot-${cust.id}`}>
                          <td className="py-2 px-1 text-center border-r border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                            {cowTotal > 0 ? `${cowTotal.toFixed(1)} L` : '-'}
                          </td>
                          <td className="py-2 px-1 text-center border-r border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                            {buffaloTotal > 0 ? `${buffaloTotal.toFixed(1)} L` : '-'}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="py-2 px-1 text-center text-blue-650 dark:text-blue-400 border-r border-slate-250 dark:border-slate-800 font-extrabold">
                      {totalLitersCow > 0 ? `${totalLitersCow.toFixed(1)} L` : '-'}
                    </td>
                    <td className="py-2 px-1 text-center text-blue-650 dark:text-blue-400 font-extrabold">
                      {totalLitersBuffalo > 0 ? `${totalLitersBuffalo.toFixed(1)} L` : '-'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>

      </div>
    </DashboardLayoutShell>
  );
}
