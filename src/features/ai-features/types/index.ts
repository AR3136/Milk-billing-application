// AI Features types
export interface PredictionResult {
  customer_id: string;
  predicted_quantity: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

export interface AnomalyAlert {
  id: string;
  type: 'quantity' | 'payment' | 'pattern';
  severity: 'low' | 'medium' | 'high';
  message: string;
  customer_id?: string;
  detected_at: string;
}

export interface InsightData {
  type: 'trend' | 'recommendation' | 'forecast';
  title: string;
  description: string;
  data?: Record<string, unknown>;
}
