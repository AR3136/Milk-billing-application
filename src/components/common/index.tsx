import React from 'react';
import { Card } from '../ui';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: {
    type: 'up' | 'down' | 'neutral';
    value: string;
  };
  color?: 'blue' | 'green' | 'amber' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subValue, 
  icon, 
  trend,
  color = 'blue'
}) => {
  const borderColors = {
    blue: 'border-l-4 border-l-blue-500',
    green: 'border-l-4 border-l-emerald-500',
    amber: 'border-l-4 border-l-amber-500',
    rose: 'border-l-4 border-l-rose-500'
  };

  const trendColors = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-rose-600 dark:text-rose-400',
    neutral: 'text-slate-500 dark:text-slate-400 dark:text-slate-500'
  };

  return (
    <Card className={`${borderColors[color]} hover:translate-y-[-2px] duration-300`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-500">{title}</p>
          <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</h4>
          {subValue && <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{subValue}</p>}
        </div>
        {icon && (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={`font-semibold ${trendColors[trend.type]}`}>{trend.value}</span>
          <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">vs last cycle</span>
        </div>
      )}
    </Card>
  );
};
export { StatCard as default };
