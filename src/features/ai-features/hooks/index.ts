import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { fetchYieldPrediction, getLatePaymentRisk, getExpenseForecast, getMLTrainingDataset } from '../services';
import { PredictionResult } from '../types';

/**
 * Custom hook to manage yield predictions, risk metrics and training dataset exports
 */
export function useAIPredictions(customerId?: string) {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [risk, setRisk] = useState<any>(null);
  const [expensesForecast, setExpensesForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAIInsights = async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const [yieldRes, riskRes, expRes] = await Promise.all([
        fetchYieldPrediction(customerId),
        getLatePaymentRisk(customerId),
        getExpenseForecast(),
      ]);
      setPrediction(yieldRes);
      setRisk(riskRes);
      setExpensesForecast(expRes);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load AI analytics forecasts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIInsights();
  }, [customerId]);

  const handleExportMLDataset = async () => {
    try {
      const dataset = await getMLTrainingDataset();
      const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ml-training-dataset-${Date.now()}.json`;
      link.click();
      toast.success('ML training dataset exported.');
    } catch (err) {
      toast.error('Failed to export training vectors.');
    }
  };

  return {
    prediction,
    risk,
    expensesForecast,
    loading,
    error,
    exportMLDataset: handleExportMLDataset,
    refresh: fetchAIInsights,
  };
}
