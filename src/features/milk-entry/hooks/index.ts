import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getMilkEntries, createMilkEntry, createMilkEntriesBulk, deleteMilkEntry } from '../services';
import { MilkEntry, MilkEntryFormData } from '../types';

/**
 * Custom hook managing daily session logs, offline cache fallbacks, and autosaving drafts.
 */
export function useMilkEntriesList(params: { date: string; shift: 'morning' | 'evening' | 'all' }) {
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMilkEntries(params);
      setEntries(res);
      
      // Cache entries in localStorage for offline availability
      localStorage.setItem(`milk-entries-${params.date}-${params.shift}`, JSON.stringify(res));
    } catch (err: any) {
      setError(err);
      
      // Retrieve from offline cache
      const cached = localStorage.getItem(`milk-entries-${params.date}-${params.shift}`);
      if (cached) {
        setEntries(JSON.parse(cached));
        toast.info('Offline mode: Loaded cached local entries.');
      } else {
        toast.error('Failed to load milk entries.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [params.date, params.shift]);

  return {
    entries,
    loading,
    error,
    refresh: fetchEntries,
  };
}

/**
 * Custom hooks managing mutations and bulk upload configurations
 */
export function useMilkEntryMutations() {
  const [isMutating, setIsMutating] = useState(false);

  const performAction = async (action: () => Promise<any>, successMsg: string) => {
    setIsMutating(true);
    try {
      const res = await action();
      toast.success(successMsg);
      return res;
    } catch (err: any) {
      toast.error(err.message || 'Operation failed.');
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  return {
    isMutating,
    createEntry: (data: MilkEntryFormData & { rate_applied: number; amount: number }) =>
      performAction(() => createMilkEntry(data), 'Milk entry logged successfully.'),
    createEntriesBulk: (entries: Array<MilkEntryFormData & { rate_applied: number; amount: number }>) =>
      performAction(() => createMilkEntriesBulk(entries), `Successfully logged ${entries.length} yield records.`),
    deleteEntry: (id: string) =>
      performAction(() => deleteMilkEntry(id), 'Milk entry deleted.'),
  };
}
