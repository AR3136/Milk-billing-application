import { createClient } from '@/lib/supabase/client';
import { PredictionResult, AnomalyAlert, InsightData } from '../types';

/**
 * Supabase client dataset builders and forecasting estimators for AI modules
 */

// 1. Estimate customer yield based on rolling average
export async function getMilkYieldPrediction(customerId: string) {
  const supabase = createClient();
  const { data: entries, error } = await supabase
    .from('milk_entries')
    .select('quantity')
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .limit(10);

  if (error) throw error;

  const total = entries?.reduce((sum, e) => sum + Number(e.quantity), 0) || 0;
  const count = entries?.length || 1;
  const avg = total / count;

  return {
    customer_id: customerId,
    predicted_quantity: parseFloat(avg.toFixed(2)),
    confidence: count > 5 ? 0.88 : 0.60,
    trend: 'stable' as const
  };
}

// 2. Score payment risk based on transaction history
export async function getLatePaymentRisk(customerId: string) {
  const supabase = createClient();

  const { data: bills, error } = await supabase
    .from('bills')
    .select('from_date, to_date, status')
    .eq('customer_id', customerId)
    .is('deleted_at', null);

  if (error) throw error;

  const totalBills = bills?.length || 0;
  const overdueCount = bills?.filter(b => b.status === 'overdue').length || 0;
  
  let riskScore = 0.1; // Baseline low risk
  if (totalBills > 0) {
    riskScore = overdueCount / totalBills;
  }

  return {
    customerId,
    riskScore: parseFloat(riskScore.toFixed(2)),
    classification: riskScore > 0.5 ? 'high' : (riskScore > 0.2 ? 'medium' : 'low'),
  };
}

// 3. Project monthly expenses based on trend curves
export async function getExpenseForecast() {
  const supabase = createClient();

  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('amount, category')
    .is('deleted_at', null);

  if (error) throw error;

  const map: Record<string, number> = {};
  expenses?.forEach(ex => {
    map[ex.category] = (map[ex.category] || 0) + Number(ex.amount);
  });

  return Object.keys(map).map(cat => ({
    category: cat,
    forecastedAmount: parseFloat((map[cat] * 1.05).toFixed(2)), // Simple projection
  }));
}

// 4. Compile flat dataset structure ready for ML modeling
export async function getMLTrainingDataset() {
  const supabase = createClient();

  const [custRes, entryRes, payRes] = await Promise.all([
    supabase.from('customers').select('*').is('deleted_at', null),
    supabase.from('milk_entries').select('*').is('deleted_at', null),
    supabase.from('payments').select('*').is('deleted_at', null)
  ]);

  if (custRes.error) throw custRes.error;
  if (entryRes.error) throw entryRes.error;
  if (payRes.error) throw payRes.error;

  // Construct vectors
  const dataset = (entryRes.data || []).map(entry => {
    const customer = (custRes.data || []).find(c => c.id === entry.customer_id);
    const matchedPays = (payRes.data || []).filter(p => p.customer_id === entry.customer_id);

    return {
      features: {
        milk_type: customer?.milk_type || 'cow',
        default_quantity: customer?.default_quantity || 0,
        historical_entries_count: matchedPays.length,
        entry_shift: entry.shift,
        entry_fat: entry.fat || null,
        entry_snf: entry.snf || null,
      },
      target: {
        yield_quantity: entry.quantity,
        rate_applied: entry.rate_applied
      }
    };
  });

  return dataset;
}
export { getMilkYieldPrediction as fetchYieldPrediction };
