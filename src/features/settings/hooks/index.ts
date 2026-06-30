import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getSettings, saveSettings, downloadDatabaseBackup } from '../services';
import { AppSettings } from '../types';

/**
 * Custom hook to retrieve app configurations
 */
export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSettings();
      setSettings(res);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    refresh: fetchSettings,
  };
}

/**
 * Custom hooks to handle updates and backups
 */
export function useSettingsActions() {
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
    saveSettings: (settings: Partial<AppSettings>) =>
      performAction(() => saveSettings(settings), 'Settings updated successfully.'),
    triggerBackup: () =>
      performAction(() => downloadDatabaseBackup(), 'Database backup generated and downloading...'),
  };
}
