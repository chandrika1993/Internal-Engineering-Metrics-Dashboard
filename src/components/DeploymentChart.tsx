"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TrendPoint } from "@/types";

interface DeploymentChartProps {
  data: TrendPoint[];
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs text-gray-400 mb-1">
        {new Date(label).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
      <p className="text-sm font-semibold text-indigo-600">
        {payload[0].value} deployments
      </p>
    </div>
  );
}

export default function DeploymentChart({
  data,
  title,
  subtitle,
  loading,
  error,
}: DeploymentChartProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>}
      </div>

      <div className="h-64">
        {loading ? (
          <div className="h-full animate-pulse rounded-xl bg-gray-100" />
        ) : error ? (
          <div className="flex h-full items-center justify-center rounded-xl bg-red-50 text-sm text-red-400">
            {error}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-400">
            No deployment data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString("en-GB", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}