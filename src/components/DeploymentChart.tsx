'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatNumber } from '@/lib/utils';
import type { TrendPoint } from '@/types';

interface DeploymentChartProps {
  data: TrendPoint[];
  loading?: boolean;
  error?: string | null;
}

// Helper to process data for the chart
const processDataForChart = (data: TrendPoint[]) => {
  return data.map(item => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }),
    value: item.value
  }));
};

export default function DeploymentChart({
  data,
  loading,
  error,
}: DeploymentChartProps) {
  if (loading) {
    return <div className="h-60 w-full animate-pulse rounded-md bg-slate-100" />;
  }

  if (error) {
    return (
      <div className="flex h-60 w-full items-center justify-center rounded-md border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700 animate-in fade-in">
        {error}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-60 w-full items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-sm text-slate-400 animate-in fade-in">
        No deployment data available for this period.
      </div>
    );
  }
  
  const chartData = processDataForChart(data);

  return (
    <div className="h-60 w-full animate-in fade-in">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 5,
            right: 20,
            left: -10,
            bottom: 5,
          }}
        >
          <XAxis
            dataKey="date"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={{ stroke: '#e2e8f0' }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={{ stroke: '#e2e8f0' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickFormatter={(val) => formatNumber(val as number)}
          />
          <Tooltip
            contentStyle={{
              background: '#ffffff',
              borderColor: '#e2e8f0',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            }}
            labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            name="Deploys"
            stroke="#4f46e5"
            strokeWidth={2}
            fill="#e0e7ff"
            fillOpacity={0.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
