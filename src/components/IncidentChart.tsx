"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { SEVERITY_CONFIG } from '@/lib/severity';
import type { TrendPoint } from "@/types";

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const formattedLabel = new Date(label).toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-2">
        <p className="font-bold text-gray-800">{formattedLabel}</p>
        {payload.map((pld) => (
          <div key={pld.dataKey} style={{ color: pld.color }}>
            {`${pld.name}: ${pld.value}`}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface IncidentChartProps {
  data: TrendPoint[];
  loading?: boolean;
  error?: string | null;
  severity: 'all' | 'critical' | 'high' | 'medium' | 'low';
  from: string;
  to: string;
}

// Helper to process data for the chart
const processDataForChart = (data: TrendPoint[]) => {
  const groupedData: { [date: string]: any } = {};

  data.forEach(item => {
    if (!groupedData[item.date]) {
      groupedData[item.date] = { date: item.date };
    }
    if (item.severity) {
      groupedData[item.date][item.severity] = item.value;
    }
  });

  return Object.values(groupedData);
};

export default function IncidentChart({
  data,
  loading,
  error,
  severity
}: IncidentChartProps) {
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
        No incident data available for this period.
      </div>
    );
  }
  
  const chartData = processDataForChart(data);
  const severitiesToShow = severity === 'all' ? ['critical', 'high', 'medium', 'low'] : [severity];
  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US", { month: 'short', day: 'numeric' });

  return (
    <div className="h-60 w-full animate-in fade-in">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate} 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={{ stroke: '#e2e8f0' }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            tickLine={{ stroke: '#e2e8f0' }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
          {severitiesToShow.map(sev => (
            <Bar 
              key={sev} 
              dataKey={sev} 
              stackId="a" 
              name={SEVERITY_CONFIG[sev as 'critical' | 'high' | 'medium' | 'low'].label}
              fill={SEVERITY_CONFIG[sev as 'critical' | 'high' | 'medium' | 'low'].color}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
