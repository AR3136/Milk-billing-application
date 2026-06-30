import React from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { PredictionResult } from '../types';
import { Brain, TrendingUp, Sparkles, Download, ShieldAlert, ArrowUpRight } from 'lucide-react';

interface PredictionInsightCardProps {
  prediction: PredictionResult;
  isLoading?: boolean;
}

/**
 * Display card for prediction indicators
 */
export const PredictionInsightCard: React.FC<PredictionInsightCardProps> = ({
  prediction,
  isLoading = false,
}) => {
  return (
    <Card 
      title="Yield Forecast Estimation" 
      subtitle="Rolling averages predictions models"
      className="border border-blue-100 bg-gradient-to-br from-white to-blue-50/10"
    >
      <div className="space-y-4 text-xs">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
            <span className="font-bold text-slate-800">ML Forecast Engine</span>
          </div>
          <Badge variant="primary" className="gap-1">
            <Sparkles className="w-3 h-3 text-blue-600 fill-blue-600" />
            {(prediction.confidence * 100).toFixed(0)}% Confidence
          </Badge>
        </div>

        <div className="py-2">
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px]">Predicted Yield (Tomorrow)</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1 flex items-baseline gap-1.5">
            {prediction.predicted_quantity} L
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> Stable
            </span>
          </h3>
        </div>

        <p className="text-[10px] text-slate-500 dark:text-slate-400">
          Projections are calculated based on a 10-day rolling delivery yield matrix.
        </p>
      </div>
    </Card>
  );
};

interface PaymentRiskMeterProps {
  riskScore: number;
  classification: 'low' | 'medium' | 'high';
}

/**
 * Payment risk score gauge
 */
export const PaymentRiskMeter: React.FC<PaymentRiskMeterProps> = ({ riskScore, classification }) => {
  const badgeColors = {
    low: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    medium: 'bg-amber-50 text-amber-600 border border-amber-100',
    high: 'bg-rose-50 text-rose-600 border border-rose-100'
  };

  return (
    <Card title="Payment Risk Scoring" subtitle="Analytics indicating late invoice payment risks">
      <div className="space-y-4 text-xs">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-slate-600">Calculated Risk Index</span>
          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold uppercase ${badgeColors[classification]}`}>
            {classification} risk
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between font-bold text-slate-500">
            <span>Dues Risk Score</span>
            <span>{(riskScore * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                classification === 'high' ? 'bg-rose-500' : (classification === 'medium' ? 'bg-amber-500' : 'bg-emerald-500')
              }`}
              style={{ width: `${riskScore * 100}%` }}
            />
          </div>
        </div>

        <p className="text-[10px] text-slate-500 dark:text-slate-400">
          Risk classification is evaluated based on invoice cycle due dates vs receipt transaction dates.
        </p>
      </div>
    </Card>
  );
};

interface MLDatasetExporterProps {
  onExport: () => void;
  isLoading?: boolean;
}

/**
 * Training dataset downloader panel
 */
export const MLDatasetExporter: React.FC<MLDatasetExporterProps> = ({ onExport, isLoading = false }) => {
  return (
    <Card title="ML Model Pipelines Setup" subtitle="Export vector payloads for pipeline integration">
      <div className="space-y-4 text-xs">
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex gap-3 text-slate-700">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <h6 className="font-bold">Structured Datasets Available</h6>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Aggregates metrics columns mapping properties to targets (yields, payments, and rate indices).
            </p>
          </div>
        </div>

        <Button onClick={onExport} disabled={isLoading} className="w-full gap-2 rounded-xl py-2.5">
          <Download className="w-4 h-4" /> Export Training Dataset
        </Button>
      </div>
    </Card>
  );
};
