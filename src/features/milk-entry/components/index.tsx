import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import { calculateEntryRate } from '../services';
import { FileUp, Sparkles, AlertCircle, Save, Check, Loader2 } from 'lucide-react';
import { read, utils } from 'xlsx';
import { toast } from 'sonner';

interface BulkEntryGridProps {
  date: string;
  shift: 'morning' | 'evening';
  onSaveBulk: (entries: any[]) => Promise<any>;
  isLoading?: boolean;
}

/**
 * Grid-view logging spreadsheet with autocalculate features and offline autosaves
 */
export const BulkEntryGrid: React.FC<BulkEntryGridProps> = ({
  date,
  shift,
  onSaveBulk,
  isLoading = false,
}) => {
  const customers = useAppStore((state) => state.customers);
  const [rows, setRows] = useState<Record<string, { quantity: string; fat: string; snf: string }>>(() => {
    const initial: any = {};
    customers.forEach(c => {
      initial[c.id] = { quantity: c.default_quantity?.toString() || '0', fat: '', snf: '' };
    });
    return initial;
  });

  const handleInputChange = (customerId: string, field: 'quantity' | 'fat' | 'snf', value: string) => {
    setRows(prev => {
      const updated = {
        ...prev,
        [customerId]: {
          ...prev[customerId],
          [field]: value
        }
      };
      // Autosave current drafts state locally
      localStorage.setItem(`bulk-draft-${date}-${shift}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleSave = () => {
    const payload: any[] = [];
    customers.forEach(c => {
      const row = rows[c.id];
      if (!row || !row.quantity || Number(row.quantity) <= 0) return;

      const baseRate = c.rate_per_liter || c.rate || 45.0;
      const fatVal = row.fat ? Number(row.fat) : undefined;
      const snfVal = row.snf ? Number(row.snf) : undefined;

      const finalRate = calculateEntryRate({
        baseRate,
        milkType: c.milk_type || c.milkType || 'cow',
        fat: fatVal,
        snf: snfVal
      });

      payload.push({
        customer_id: c.id,
        date,
        shift,
        quantity: Number(row.quantity),
        fat: fatVal,
        snf: snfVal,
        rate_applied: finalRate,
        amount: Number(row.quantity) * finalRate
      });
    });

    if (payload.length === 0) {
      toast.info('No entries to save.');
      return;
    }

    onSaveBulk(payload);
  };

  // Parse Excel import sheet
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const records: any[] = utils.sheet_to_json(sheet);

        const updated = { ...rows };
        records.forEach((rec: any) => {
          const cust = customers.find(c => c.name.toLowerCase() === rec.Name?.toLowerCase());
          if (cust) {
            updated[cust.id] = {
              quantity: rec.Quantity?.toString() || '0',
              fat: rec.Fat?.toString() || '',
              snf: rec.SNF?.toString() || ''
            };
          }
        });

        setRows(updated);
        toast.success('Spreadsheet yields imported successfully.');
      } catch (err) {
        toast.error('Failed to parse Excel file format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <Card 
      title={`Batch logging sheet (${shift.toUpperCase()})`} 
      subtitle="Edit values directly in table cells. Calculations update in real-time."
    >
      <div className="flex justify-between items-center gap-4 mb-4 flex-wrap text-xs">
        <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/50 transition">
          <FileUp className="w-4 h-4 text-slate-500" />
          <span>Upload Yield spreadsheet (.xlsx)</span>
          <input type="file" accept=".xlsx" className="hidden" onChange={handleExcelImport} />
        </label>

        <Badge variant="primary" className="gap-1.5"><Sparkles className="w-3 h-3" /> Drafts autosave enabled</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 dark:text-slate-400 uppercase font-semibold">
              <th className="py-2.5 px-3">Name</th>
              <th className="py-2.5 px-3">Milk Type</th>
              <th className="py-2.5 px-3">Base Price</th>
              <th className="py-2.5 px-3">Quantity (L)</th>
              <th className="py-2.5 px-3">Fat %</th>
              <th className="py-2.5 px-3">SNF %</th>
              <th className="py-2.5 px-3 text-right">Yield rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {customers.map(c => {
              const row = rows[c.id] || { quantity: '0', fat: '', snf: '' };
              const calculated = calculateEntryRate({
                baseRate: c.rate_per_liter || c.rate || 45.0,
                milkType: c.milk_type || c.milkType || 'cow',
                fat: row.fat ? Number(row.fat) : undefined,
                snf: row.snf ? Number(row.snf) : undefined
              });

              return (
                <tr key={c.id}>
                  <td className="py-3 px-3 font-semibold text-slate-700">{c.name}</td>
                  <td className="py-3 px-3 uppercase text-slate-500 dark:text-slate-400 font-bold">{c.milk_type || c.milkType}</td>
                  <td className="py-3 px-3">₹{c.rate_per_liter || c.rate}/L</td>
                  <td className="py-3 px-3">
                    <input 
                      type="number" 
                      step="0.1"
                      className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center"
                      value={row.quantity}
                      onChange={e => handleInputChange(c.id, 'quantity', e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input 
                      type="number" 
                      step="0.1"
                      placeholder="Std"
                      className="w-14 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center"
                      value={row.fat}
                      onChange={e => handleInputChange(c.id, 'fat', e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input 
                      type="number" 
                      step="0.1"
                      placeholder="Std"
                      className="w-14 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center"
                      value={row.snf}
                      onChange={e => handleInputChange(c.id, 'snf', e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-700">₹{calculated.toFixed(2)}/L</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 justify-end pt-5 border-t border-slate-50 mt-5">
        <Button onClick={handleSave} disabled={isLoading} className="gap-2">
          {isLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Check className="w-4.5 h-4.5" />}
          Log Batch Yields
        </Button>
      </div>
    </Card>
  );
};
