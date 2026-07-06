'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DashboardLayoutShell } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import type { MilkType } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Calendar, ChevronDown, Search, Loader2, Save, AlertTriangle,
  Sun, Moon, Info, CheckSquare, Square, X, RefreshCw,
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type EntryStatus = 'normal' | 'holiday' | 'absent' | 'no_collection' | 'skip';
type PricingMethod = 'by_quantity' | 'by_amount';

const STATUS_CONFIG: Record<EntryStatus, { label: string; color: string; short: string }> = {
  normal:        { label: 'Normal',        short: 'Normal', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  holiday:       { label: 'Holiday',       short: 'Holiday', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  absent:        { label: 'Absent',        short: 'Absent',  color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  no_collection: { label: 'No Collection', short: 'No Coll', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  skip:          { label: 'Skip',          short: 'Skip',    color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShiftData {
  status: EntryStatus;
  pricingMethod: PricingMethod;
  milkType: 'cow' | 'buffalo' | 'mixed';
  quantity: string;
  rate: string;
  amount: string;
  existingId: string | null;
}

interface DayRow {
  date: string;
  dayNum: number;
  dayName: string;
  morning: ShiftData;
  evening: ShiftData;
  remarks: string;
  selected: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function makeDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function computeAmountForShift(s: ShiftData): number {
  if (s.status !== 'normal') return 0;
  if (s.pricingMethod === 'by_amount') return parseFloat(s.amount) || 0;
  const qty = parseFloat(s.quantity) || 0;
  const rate = parseFloat(s.rate) || 0;
  return Math.floor(qty * rate);
}

function makeDefaultShift(
  milkType: 'cow' | 'buffalo' | 'mixed',
  rate: string,
  existingId: string | null = null,
  isWeekend = false,
): ShiftData {
  return {
    status: isWeekend ? 'holiday' : 'normal',
    pricingMethod: 'by_quantity',
    milkType,
    quantity: '',
    rate,
    amount: '',
    existingId,
  };
}

// ─── Sub-navigation (shared between Daily Entry and Bulk Historical) ───────────

function MilkEntrySubNav() {
  const pathname = usePathname();
  const tabs = [
    { href: '/milk-entry',            label: 'Daily Entry' },
    { href: '/milk-entry/bulk-historical', label: 'Bulk Historical Entry' },
  ];
  return (
    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5 w-fit">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
            pathname === tab.href
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

// ─── Shift Input Cell (used in desktop table rows) ────────────────────────────

interface ShiftCellProps {
  shift: ShiftData;
  shiftKey: 'morning' | 'evening';
  onChange: (field: keyof ShiftData, value: string) => void;
  disabled?: boolean;
}

function ShiftCell({ shift, shiftKey, onChange, disabled }: ShiftCellProps) {
  const isSkipped = shift.status !== 'normal';
  const hasDup = !!shift.existingId;

  return (
    <div className={`space-y-1.5 min-w-[220px] ${hasDup ? 'opacity-60' : ''}`}>
      {/* Status selector */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <select
          value={shift.status}
          onChange={e => onChange('status', e.target.value)}
          disabled={disabled || hasDup}
          className={`flex-1 min-w-[90px] px-2 py-1 text-[10px] font-semibold rounded-lg border-0 outline-none cursor-pointer ${STATUS_CONFIG[shift.status].color}`}
        >
          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val}>{cfg.label}</option>
          ))}
        </select>
        {hasDup && (
          <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md font-bold">EXISTS</span>
        )}
      </div>

      {/* Inputs — hidden when status isn't normal */}
      {!isSkipped && !hasDup && (
        <>
          {/* Pricing method toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => onChange('pricingMethod', 'by_quantity')}
              disabled={disabled}
              className={`flex-1 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                shift.pricingMethod === 'by_quantity'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              By Qty
            </button>
            <button
              type="button"
              onClick={() => onChange('pricingMethod', 'by_amount')}
              disabled={disabled}
              className={`flex-1 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                shift.pricingMethod === 'by_amount'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              By ₹
            </button>
          </div>

          {/* Milk type select */}
          <select
            value={shift.milkType}
            onChange={e => onChange('milkType', e.target.value)}
            disabled={disabled}
            className="w-full px-2 py-1 text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none text-slate-700 dark:text-slate-300"
          >
            <option value="cow">🐄 Cow</option>
            <option value="buffalo">🐃 Buffalo</option>
            <option value="mixed">🥛 Mixed</option>
          </select>

          {/* Quantity + Rate (by_quantity mode) */}
          {shift.pricingMethod === 'by_quantity' && (
            <div className="flex gap-1">
              <div className="flex-1">
                <div className="text-[9px] text-slate-400 mb-0.5 font-semibold">QTY (L)</div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={shift.quantity}
                  onChange={e => onChange('quantity', e.target.value)}
                  disabled={disabled}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex-1">
                <div className="text-[9px] text-slate-400 mb-0.5 font-semibold">RATE (₹)</div>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  placeholder="0"
                  value={shift.rate}
                  onChange={e => onChange('rate', e.target.value)}
                  disabled={disabled}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* Amount-only (by_amount mode) */}
          {shift.pricingMethod === 'by_amount' && (
            <div>
              <div className="text-[9px] text-slate-400 mb-0.5 font-semibold">AMOUNT (₹)</div>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="0"
                value={shift.amount}
                onChange={e => onChange('amount', e.target.value)}
                disabled={disabled}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
              />
            </div>
          )}

          {/* Computed amount preview */}
          {shift.pricingMethod === 'by_quantity' && shift.quantity && shift.rate && (
            <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 text-right">
              = ₹{Math.floor(parseFloat(shift.quantity) * parseFloat(shift.rate))}
            </div>
          )}
        </>
      )}

      {/* Skipped / non-normal status notice */}
      {isSkipped && !hasDup && (
        <div className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-1">
          {shift.status === 'skip' ? 'Skipped — no entry saved' : `Not saved (${STATUS_CONFIG[shift.status].label})`}
        </div>
      )}
    </div>
  );
}

// ─── Mobile Card Row ───────────────────────────────────────────────────────────

interface MobileCardProps {
  row: DayRow;
  idx: number;
  onUpdateShift: (idx: number, shift: 'morning' | 'evening', field: keyof ShiftData, value: string) => void;
  onUpdateRow: (idx: number, field: 'remarks' | 'selected', value: any) => void;
  disabled: boolean;
}

function MobileCard({ row, idx, onUpdateShift, onUpdateRow, disabled }: MobileCardProps) {
  const [expanded, setExpanded] = useState(false);
  const morningAmt = computeAmountForShift(row.morning);
  const eveningAmt = computeAmountForShift(row.evening);
  const totalAmt = morningAmt + eveningAmt;

  return (
    <div className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden transition-all ${
      row.selected ? 'border-blue-400 dark:border-blue-600' : 'border-slate-100 dark:border-slate-800'
    }`}>
      {/* Card header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <input
          type="checkbox"
          checked={row.selected}
          onChange={e => { e.stopPropagation(); onUpdateRow(idx, 'selected', e.target.checked); }}
          className="rounded border-slate-300 text-blue-600 w-4 h-4"
          onClick={e => e.stopPropagation()}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
              {row.dayNum} {row.dayName}
            </span>
            {(row.morning.existingId || row.evening.existingId) && (
              <Badge variant="warning" className="text-[9px]">Has Entry</Badge>
            )}
          </div>
          <div className="flex gap-3 mt-0.5">
            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
              <Sun className="w-3 h-3" />
              {row.morning.status === 'normal' && !row.morning.existingId
                ? (morningAmt > 0 ? <span className="font-bold text-emerald-600">₹{morningAmt}</span> : <span className="text-slate-400">—</span>)
                : <span className={`text-[9px] font-bold px-1 rounded ${STATUS_CONFIG[row.morning.status].color}`}>{STATUS_CONFIG[row.morning.status].short}</span>
              }
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
              <Moon className="w-3 h-3" />
              {row.evening.status === 'normal' && !row.evening.existingId
                ? (eveningAmt > 0 ? <span className="font-bold text-amber-600">₹{eveningAmt}</span> : <span className="text-slate-400">—</span>)
                : <span className={`text-[9px] font-bold px-1 rounded ${STATUS_CONFIG[row.evening.status].color}`}>{STATUS_CONFIG[row.evening.status].short}</span>
              }
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          {totalAmt > 0 && <div className="text-sm font-black text-slate-800 dark:text-slate-100">₹{totalAmt}</div>}
          <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded inputs */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-3">
          {/* Morning */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Morning</span>
            </div>
            <ShiftCell
              shift={row.morning}
              shiftKey="morning"
              onChange={(field, value) => onUpdateShift(idx, 'morning', field, value)}
              disabled={disabled}
            />
          </div>

          {/* Evening */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Evening</span>
            </div>
            <ShiftCell
              shift={row.evening}
              shiftKey="evening"
              onChange={(field, value) => onUpdateShift(idx, 'evening', field, value)}
              disabled={disabled}
            />
          </div>

          {/* Remarks */}
          <div>
            <div className="text-[10px] text-slate-400 mb-0.5 font-semibold uppercase tracking-wider">Remarks (optional)</div>
            <input
              type="text"
              placeholder="Notes..."
              value={row.remarks}
              onChange={e => onUpdateRow(idx, 'remarks', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BulkHistoricalEntryPage() {
  const customers = useAppStore(s => s.customers);
  const fetchData  = useAppStore(s => s.fetchData);
  const currentUser = useAppStore(s => s.currentUser);

  const now = new Date();

  // ── Controls state ──────────────────────────────────────────────────────────
  const [custSearch, setCustSearch]     = useState('');
  const [custOpen, setCustOpen]         = useState(false);
  const [selectedCustId, setSelectedCustId] = useState('');
  const [month, setMonth]   = useState(now.getMonth() === 0 ? 12 : now.getMonth()); // previous month
  const [year, setYear]     = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
  const [defaultMilkType, setDefaultMilkType] = useState<'cow' | 'buffalo' | 'mixed'>('cow');
  const [defaultRate, setDefaultRate]   = useState('');

  // ── Table state ─────────────────────────────────────────────────────────────
  const [rows, setRows]                 = useState<DayRow[]>([]);
  const [isMonthLoaded, setIsMonthLoaded] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);

  // ── Save state ──────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving]         = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [showConfirm, setShowConfirm]   = useState<'all' | 'selected' | null>(null);

  const selectedCust = customers.find(c => c.id === selectedCustId);

  // ── Filtered customers ──────────────────────────────────────────────────────
  const filteredCustomers = useMemo(() =>
    customers.filter(c =>
      c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(custSearch))
    ), [customers, custSearch]);

  // ── Auto-set defaults from customer ────────────────────────────────────────
  useEffect(() => {
    if (!selectedCust) return;
    if (selectedCust.milkType === 'both') {
      setDefaultMilkType('cow');
      setDefaultRate(String(selectedCust.rateCow || selectedCust.rate || ''));
    } else if (selectedCust.milkType === 'mixed') {
      setDefaultMilkType('mixed');
      setDefaultRate(String(selectedCust.rate || ''));
    } else {
      setDefaultMilkType(selectedCust.milkType as 'cow' | 'buffalo');
      setDefaultRate(String(selectedCust.rate || ''));
    }
    setIsMonthLoaded(false);
    setRows([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustId]);

  // ── Update a single shift field ─────────────────────────────────────────────
  const updateShift = useCallback((
    dayIdx: number,
    shiftKey: 'morning' | 'evening',
    field: keyof ShiftData,
    value: string,
  ) => {
    setRows(prev => {
      const next = [...prev];
      const row = { ...next[dayIdx] };
      const shiftData = { ...row[shiftKey] as ShiftData };
      (shiftData as any)[field] = value;

      // Auto-compute amount when qty or rate changes in by_quantity mode
      if (shiftData.pricingMethod === 'by_quantity') {
        if (field === 'quantity' || field === 'rate') {
          const qty  = parseFloat(field === 'quantity' ? value : shiftData.quantity) || 0;
          const rate = parseFloat(field === 'rate'     ? value : shiftData.rate)     || 0;
          shiftData.amount = qty > 0 && rate > 0 ? String(Math.floor(qty * rate)) : '';
        }
      }

      // Switching pricing method → reset fields
      if (field === 'pricingMethod') {
        if (value === 'by_amount') {
          shiftData.quantity = '';
          shiftData.rate = '';
          shiftData.amount = '';
        } else {
          shiftData.amount = '';
        }
      }

      (row as any)[shiftKey] = shiftData;
      next[dayIdx] = row;
      return next;
    });
  }, []);

  // ── Update a row-level field ────────────────────────────────────────────────
  const updateRow = useCallback((dayIdx: number, field: 'remarks' | 'selected', value: any) => {
    setRows(prev => {
      const next = [...prev];
      next[dayIdx] = { ...next[dayIdx], [field]: value };
      return next;
    });
  }, []);

  // ── Toggle all selected ─────────────────────────────────────────────────────
  const toggleAllSelected = () => {
    const allSel = rows.length > 0 && rows.every(r => r.selected);
    setRows(prev => prev.map(r => ({ ...r, selected: !allSel })));
  };

  // ── Apply defaults to all rows ──────────────────────────────────────────────
  const applyDefaultsToAll = () => {
    setRows(prev => prev.map(row => {
      const applyToShift = (s: ShiftData): ShiftData => {
        if (s.existingId || s.status !== 'normal') return s;
        const updated = { ...s, milkType: defaultMilkType, rate: defaultRate };
        if (s.pricingMethod === 'by_quantity' && s.quantity) {
          updated.amount = String(Math.floor(parseFloat(s.quantity) * parseFloat(defaultRate || '0')));
        }
        return updated;
      };
      return { ...row, morning: applyToShift(row.morning), evening: applyToShift(row.evening) };
    }));
    toast.success('Applied default milk type and rate to all rows.');
  };

  // ── Load month: generate rows + check existing ──────────────────────────────
  const loadMonth = async () => {
    if (!selectedCustId) { toast.error('Please select a customer first.'); return; }
    setIsLoading(true);
    try {
      const daysInMonth = getDaysInMonth(year, month);
      const startDate = makeDateStr(year, month, 1);
      const endDate   = makeDateStr(year, month, daysInMonth);

      // Fetch existing entries for this customer + month
      const supabase = createClient();
      const { data: existing, error } = await supabase
        .from('milk_entries')
        .select('id, date, shift')
        .eq('customer_id', selectedCustId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw new Error(error.message);

      // Build lookup: "YYYY-MM-DD-morning" → id
      const existingMap: Record<string, string> = {};
      (existing ?? []).forEach(e => {
        existingMap[`${e.date}-${e.shift}`] = e.id;
      });

      // Generate one row per day
      const newRows: DayRow[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr   = makeDateStr(year, month, day);
        const dayOfWeek = new Date(dateStr).getDay(); // 0=Sun
        const isWeekend = dayOfWeek === 0;

        newRows.push({
          date: dateStr,
          dayNum: day,
          dayName: DAY_NAMES[dayOfWeek],
          morning: makeDefaultShift(
            defaultMilkType, defaultRate,
            existingMap[`${dateStr}-morning`] ?? null,
            isWeekend,
          ),
          evening: makeDefaultShift(
            defaultMilkType, defaultRate,
            existingMap[`${dateStr}-evening`] ?? null,
            isWeekend,
          ),
          remarks: '',
          selected: false,
        });
      }

      setRows(newRows);
      setIsMonthLoaded(true);

      const dupCount = Object.keys(existingMap).length;
      if (dupCount > 0) {
        toast.warning(`${dupCount} existing entr${dupCount === 1 ? 'y' : 'ies'} found — highlighted in amber. They will be skipped.`);
      } else {
        toast.success(`Loaded ${daysInMonth} days for ${MONTH_NAMES[month - 1]} ${year}.`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load month data.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Build DB payload for a single shift ─────────────────────────────────────
  const buildPayload = (
    row: DayRow,
    shiftKey: 'morning' | 'evening',
  ): { customer_id: string; user_id: string; date: string; shift: string; quantity: number; rate_applied: number; milk_type: string } | null => {
    if (!currentUser || !selectedCust) return null;
    const s = row[shiftKey] as ShiftData;

    // Skip: existing, non-normal status, or empty values
    if (s.existingId) return null;
    if (s.status !== 'normal') return null;

    if (s.pricingMethod === 'by_quantity') {
      const qty  = parseFloat(s.quantity);
      const rate = parseFloat(s.rate);
      if (!qty || isNaN(qty) || qty <= 0) return null;
      if (!rate || isNaN(rate) || rate <= 0) return null;
      return {
        customer_id: selectedCustId,
        user_id: currentUser.id,
        date: row.date,
        shift: shiftKey,
        quantity: qty,
        rate_applied: rate,
        milk_type: s.milkType,
      };
    } else {
      // by_amount: back-calculate quantity from amount / rate (same approach as daily entry)
      const amt  = parseFloat(s.amount);
      if (!amt || isNaN(amt) || amt <= 0) return null;
      const rate = parseFloat(defaultRate) || parseFloat(s.rate) || 0;
      if (rate <= 0) {
        // Cannot back-calculate without a rate — store as 0 qty with the amount as rate (1 unit)
        // This matches the "by_amount" intent by storing amt as rate_applied for qty=1
        return {
          customer_id: selectedCustId,
          user_id: currentUser.id,
          date: row.date,
          shift: shiftKey,
          quantity: 1,
          rate_applied: amt,
          milk_type: s.milkType,
        };
      }
      // Back-calculate liters (same approach as daily entry's "rupees" mode)
      const qty = parseFloat((amt / rate).toFixed(3));
      return {
        customer_id: selectedCustId,
        user_id: currentUser.id,
        date: row.date,
        shift: shiftKey,
        quantity: qty,
        rate_applied: rate,
        milk_type: s.milkType,
      };
    }
  };

  // ── Count saveable entries ──────────────────────────────────────────────────
  const countSaveable = (rowList: DayRow[]) => {
    let n = 0;
    for (const row of rowList) {
      if (buildPayload(row, 'morning')) n++;
      if (buildPayload(row, 'evening')) n++;
    }
    return n;
  };

  // ── Perform save ────────────────────────────────────────────────────────────
  const performSave = async (rowList: DayRow[]) => {
    if (!currentUser || !selectedCust) {
      toast.error('Authentication error. Please refresh.'); return;
    }

    const records = rowList.flatMap(row => {
      const m = buildPayload(row, 'morning');
      const e = buildPayload(row, 'evening');
      return [m, e].filter(Boolean) as NonNullable<ReturnType<typeof buildPayload>>[];
    });

    if (records.length === 0) {
      toast.info('No valid entries to save. Fill in quantity/amount fields for normal-status rows.');
      setShowConfirm(null); return;
    }

    setIsSaving(true);
    setSaveProgress(10);
    setShowConfirm(null);

    try {
      const supabase = createClient();

      // Batch insert — Supabase treats this as atomic at the DB level
      setSaveProgress(30);
      const { data: inserted, error } = await supabase
        .from('milk_entries')
        .insert(records)
        .select('id');

      if (error) throw new Error(`Database error: ${error.message}`);
      setSaveProgress(70);

      // Refresh global store so dashboard / reports / billing update
      await fetchData();
      setSaveProgress(100);

      const savedCount = inserted?.length ?? 0;
      toast.success(`✓ Saved ${savedCount} entr${savedCount === 1 ? 'y' : 'ies'} for ${selectedCust.name} — ${MONTH_NAMES[month - 1]} ${year}`);

      // Reload month to refresh duplicate markers
      await loadMonth();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
    }
  };

  const handleSaveAll = () => {
    if (countSaveable(rows) === 0) {
      toast.info('No valid entries to save. Enter quantity/amount in at least one row.'); return;
    }
    setShowConfirm('all');
  };

  const handleSaveSelected = () => {
    const sel = rows.filter(r => r.selected);
    if (sel.length === 0) { toast.error('Select at least one row using the checkboxes.'); return; }
    if (countSaveable(sel) === 0) {
      toast.info('Selected rows have no valid entries. Fill quantity/amount fields.'); return;
    }
    setShowConfirm('selected');
  };

  const handleSaveRow = (idx: number) => {
    if (countSaveable([rows[idx]]) === 0) {
      toast.info('No valid entry in this row. Add quantity or amount first.'); return;
    }
    performSave([rows[idx]]);
  };

  const confirmSave = () => {
    if (showConfirm === 'all')      performSave(rows);
    if (showConfirm === 'selected') performSave(rows.filter(r => r.selected));
  };

  // ── Computed stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let morningTotal = 0, eveningTotal = 0, filledDays = 0, dupCount = 0;
    for (const row of rows) {
      const m = computeAmountForShift(row.morning);
      const e = computeAmountForShift(row.evening);
      morningTotal += m;
      eveningTotal += e;
      if (m > 0 || e > 0) filledDays++;
      if (row.morning.existingId) dupCount++;
      if (row.evening.existingId) dupCount++;
    }
    return { morningTotal, eveningTotal, filledDays, dupCount };
  }, [rows]);

  const selectedCount    = rows.filter(r => r.selected).length;
  const saveableTotal    = countSaveable(rows);
  const saveableSelected = countSaveable(rows.filter(r => r.selected));

  // ── Year options ────────────────────────────────────────────────────────────
  const yearOptions = useMemo(() => {
    const opts: number[] = [];
    for (let y = now.getFullYear() - 4; y <= now.getFullYear(); y++) opts.push(y);
    return opts;
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayoutShell title="Bulk Historical Entry">
      <div className="space-y-5">

        {/* Sub-navigation tabs */}
        <MilkEntrySubNav />

        {/* ── Controls card ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            Select Customer & Month
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Customer searchable dropdown */}
            <div className="relative lg:col-span-2" id="customer-dropdown">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Customer</label>
              <div
                role="button"
                tabIndex={0}
                className="mt-1 flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setCustOpen(o => !o)}
                onKeyDown={e => e.key === 'Enter' && setCustOpen(o => !o)}
              >
                <span className={selectedCust ? 'text-slate-800 dark:text-slate-100 font-medium truncate' : 'text-slate-400 dark:text-slate-500'}>
                  {selectedCust
                    ? `${selectedCust.name}${selectedCust.phone ? ` · ${selectedCust.phone}` : ''}`
                    : 'Search & select a customer…'}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform ${custOpen ? 'rotate-180' : ''}`} />
              </div>

              {custOpen && (
                <div className="absolute z-30 top-full left-0 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        autoFocus
                        placeholder="Name or phone…"
                        value={custSearch}
                        onChange={e => setCustSearch(e.target.value)}
                        className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 outline-none"
                      />
                      {custSearch && (
                        <button onClick={() => setCustSearch('')}>
                          <X className="w-3 h-3 text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="px-4 py-4 text-center text-xs text-slate-400">No customers found</div>
                    ) : filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustId(c.id);
                          setCustOpen(false);
                          setCustSearch('');
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                          c.id === selectedCustId
                            ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-slate-400 dark:text-slate-500 mt-0.5 text-[10px]">
                          {c.phone} · {c.milkType === 'both' ? `Cow ₹${c.rateCow}/L · Buffalo ₹${c.rateBuffalo}/L` : `${c.milkType} · ₹${c.rate}/L`}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Month selector */}
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Month</label>
              <select
                value={month}
                onChange={e => { setMonth(Number(e.target.value)); setIsMonthLoaded(false); }}
                className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            {/* Year selector */}
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Year</label>
              <select
                value={year}
                onChange={e => { setYear(Number(e.target.value)); setIsMonthLoaded(false); }}
                className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Defaults row */}
          <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Default Milk Type</label>
              <select
                value={defaultMilkType}
                onChange={e => setDefaultMilkType(e.target.value as any)}
                className="mt-1 block px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                <option value="cow">🐄 Cow</option>
                <option value="buffalo">🐃 Buffalo</option>
                <option value="mixed">🥛 Mixed</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Default Rate (₹/L)</label>
              <input
                type="number"
                step="0.50"
                min="0"
                value={defaultRate}
                onChange={e => setDefaultRate(e.target.value)}
                placeholder="e.g. 60"
                className="mt-1 block w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button
              variant="outline"
              onClick={applyDefaultsToAll}
              disabled={!isMonthLoaded || isSaving}
              className="text-xs py-2 px-3 rounded-xl"
            >
              Apply to All Rows
            </Button>

            {/* Load month button — right-aligned */}
            <Button
              variant="primary"
              onClick={loadMonth}
              disabled={isLoading || !selectedCustId}
              id="load-month-btn"
              className="ml-auto text-xs py-2 px-4 rounded-xl gap-2 flex items-center"
            >
              {isLoading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</>
                : <><Calendar className="w-3.5 h-3.5" /> {isMonthLoaded ? 'Reload' : `Load`} {MONTH_NAMES[month - 1]} {year}</>
              }
            </Button>
          </div>
        </div>

        {/* ── Intro banner (pre-load) ─────────────────────────────────── */}
        {!isMonthLoaded && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl text-sm text-blue-700 dark:text-blue-300">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-blue-800 dark:text-blue-200">How to use Bulk Historical Entry</p>
              <ol className="text-xs space-y-0.5 text-blue-600 dark:text-blue-400 list-decimal list-inside">
                <li>Select a customer, month and year above.</li>
                <li>Click <strong>Load Month</strong> to generate the full-month grid.</li>
                <li>Fill in morning / evening quantities or amounts day by day.</li>
                <li>Use <strong>Save Entire Month</strong> or save individual rows.</li>
              </ol>
              <p className="text-[10px] text-blue-500 dark:text-blue-500 pt-1">
                All entries are saved to the existing milk_entries table — identical to daily entries. Reports, billing, and customer history update automatically.
              </p>
            </div>
          </div>
        )}

        {/* ── Summary stats ────────────────────────────────────────────── */}
        {isMonthLoaded && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Days Filled',    value: stats.filledDays,             sub: `of ${rows.length}`,   color: 'text-blue-600 dark:text-blue-400'    },
              { label: 'Morning Total',  value: `₹${stats.morningTotal}`,     sub: 'amount',               color: 'text-amber-600 dark:text-amber-400'  },
              { label: 'Evening Total',  value: `₹${stats.eveningTotal}`,     sub: 'amount',               color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Grand Total',    value: `₹${stats.morningTotal + stats.eveningTotal}`, sub: 'this month', color: 'text-emerald-600 dark:text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                <p className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Desktop table ─────────────────────────────────────────────── */}
        {isMonthLoaded && (
          <>
            <div className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && rows.every(r => r.selected)}
                    onChange={toggleAllSelected}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {MONTH_NAMES[month - 1]} {year} — {selectedCust?.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {saveableTotal} new entr{saveableTotal === 1 ? 'y' : 'ies'} ready to save
                      {stats.dupCount > 0 && ` · ${stats.dupCount} existing (amber) will be skipped`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={loadMonth}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-200 dark:bg-amber-800 inline-block" /> Existing</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-100 dark:bg-slate-700 inline-block" /> Skipped</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                      <th className="py-2 pl-5 pr-2 text-left w-10">
                        <input type="checkbox"
                          checked={rows.length > 0 && rows.every(r => r.selected)}
                          onChange={toggleAllSelected}
                          className="rounded border-slate-300 text-blue-600"
                        />
                      </th>
                      <th className="py-2 px-3 text-left w-24">Date</th>
                      <th className="py-2 px-3 text-left">
                        <div className="flex items-center gap-1"><Sun className="w-3 h-3 text-amber-500" /> Morning</div>
                      </th>
                      <th className="py-2 px-3 text-left">
                        <div className="flex items-center gap-1"><Moon className="w-3 h-3 text-indigo-500" /> Evening</div>
                      </th>
                      <th className="py-2 px-3 text-left w-28">Remarks</th>
                      <th className="py-2 pr-5 text-right w-20">Save Row</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {rows.map((row, idx) => (
                      <tr
                        key={row.date}
                        className={`transition-colors ${
                          row.selected ? 'bg-blue-50/30 dark:bg-blue-950/10' : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/20'
                        } ${row.dayName === 'Sun' ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="pl-5 pr-2 py-2.5">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={e => updateRow(idx, 'selected', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600"
                          />
                        </td>

                        {/* Date */}
                        <td className="px-3 py-2.5">
                          <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{row.dayNum}</div>
                          <div className={`text-[10px] font-semibold ${row.dayName === 'Sun' ? 'text-amber-500' : 'text-slate-400'}`}>
                            {row.dayName}
                          </div>
                        </td>

                        {/* Morning */}
                        <td className="px-3 py-2.5 align-top">
                          <ShiftCell
                            shift={row.morning}
                            shiftKey="morning"
                            onChange={(field, value) => updateShift(idx, 'morning', field, value)}
                            disabled={isSaving}
                          />
                        </td>

                        {/* Evening */}
                        <td className="px-3 py-2.5 align-top">
                          <ShiftCell
                            shift={row.evening}
                            shiftKey="evening"
                            onChange={(field, value) => updateShift(idx, 'evening', field, value)}
                            disabled={isSaving}
                          />
                        </td>

                        {/* Remarks */}
                        <td className="px-3 py-2.5 align-top">
                          <input
                            type="text"
                            placeholder="Notes…"
                            value={row.remarks}
                            onChange={e => updateRow(idx, 'remarks', e.target.value)}
                            disabled={isSaving}
                            className="w-full px-2 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-700 dark:text-slate-300"
                          />
                        </td>

                        {/* Save row */}
                        <td className="pr-5 py-2.5 text-right align-top">
                          <button
                            onClick={() => handleSaveRow(idx)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 rounded-lg transition-colors"
                            title="Save this row"
                          >
                            <Save className="w-3 h-3" /> Save
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Mobile cards ─────────────────────────────────────────────── */}
            <div className="lg:hidden space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {MONTH_NAMES[month - 1]} {year} — {selectedCust?.name}
                </h3>
                <button
                  onClick={toggleAllSelected}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1"
                >
                  {rows.every(r => r.selected) ? <Square className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
                  {rows.every(r => r.selected) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              {rows.map((row, idx) => (
                <MobileCard
                  key={row.date}
                  row={row}
                  idx={idx}
                  onUpdateShift={updateShift}
                  onUpdateRow={updateRow}
                  disabled={isSaving}
                />
              ))}
            </div>

            {/* ── Sticky save bar ───────────────────────────────────────────── */}
            <div className="sticky bottom-4 z-20" id="bulk-save-bar">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-2xl shadow-slate-900/20 dark:shadow-slate-950/50">
                {isSaving ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                      Saving entries… {saveProgress}%
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${saveProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-bold text-slate-700 dark:text-slate-200">{selectedCount}</span> selected ·{' '}
                      <span className="font-bold text-blue-600 dark:text-blue-400">{saveableTotal}</span> saveable
                      {stats.dupCount > 0 && <> · <span className="font-bold text-amber-500">{stats.dupCount}</span> existing</>}
                    </div>
                    <button
                      onClick={handleSaveSelected}
                      disabled={selectedCount === 0}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    >
                      Save Selected ({saveableSelected})
                    </button>
                    <button
                      onClick={handleSaveAll}
                      id="save-month-btn"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-40"
                      disabled={saveableTotal === 0}
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Entire Month ({saveableTotal})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Confirm save modal ─────────────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 max-w-sm w-full space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                <Save className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {showConfirm === 'all' ? 'Save Entire Month?' : 'Save Selected Rows?'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedCust?.name} · {MONTH_NAMES[month - 1]} {year}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                <strong>
                  {showConfirm === 'all' ? saveableTotal : saveableSelected}
                </strong> new entr{(showConfirm === 'all' ? saveableTotal : saveableSelected) === 1 ? 'y' : 'ies'} will be saved
              </div>
              {stats.dupCount > 0 && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {stats.dupCount} existing entr{stats.dupCount === 1 ? 'y' : 'ies'} will be skipped
                </div>
              )}
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                Reports, billing &amp; dashboard update automatically
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayoutShell>
  );
}
