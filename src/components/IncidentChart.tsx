"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TrendPoint } from "@/types";
import { SEVERITY_CONFIG, type SeverityFilter } from "@/lib/severity";

interface IncidentChartProps {
  data: TrendPoint[];
  severity: SeverityFilter;
  loading?: boolean;
  error?: string | null;
  from?: string;
  to?: string;
}

export default function IncidentChart({
  data,
  severity,
  loading,
  error,
  from,
  to,
}: IncidentChartProps) {
  const chartData = useMemo(() => {
    if (!data) return [];

    // Build a complete list of week-start dates between from and to
    const start = from ? new Date(from) : null;
    const end = to ? new Date(to) : null;

    const allWeeks: string[] = [];
    if (start && end) {
      const cursor = new Date(start);
      // Align to Monday
      cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
      while (cursor <= end) {
        allWeeks.push(cursor.toISOString().split("T")[0]);
        cursor.setDate(cursor.getDate() + 7);
      }
    }

    const filtered =
      severity !== "all" ? data.filter((d) => d.severity === severity) : data;

    const aggregated = new Map<string, number>();

    // Pre-fill all weeks with 0
    for (const week of allWeeks) {
      aggregated.set(week, 0);
    }

    // Fill in actual values
    for (const point of filtered) {
      aggregated.set(
        point.date,
        (aggregated.get(point.date) ?? 0) + point.value
      );
    }

    return Array.from(aggregated.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data, severity, from, to]);

  const { color } = SEVERITY_CONFIG[severity];

  // ✅ LOADING STATE
  if (loading) {
    return <div className="h-64 animate-pulse rounded bg-gray-200" />;
  }

  // ❌ ERROR STATE
  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-red-500">
        Failed to load incident data
      </div>
    );
  }

  // 📭 EMPTY STATE
  if (!chartData.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        No incidents for this severity
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) =>
              new Date(v).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
          />

          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />

          <Tooltip
            formatter={(value) => [value, "Incidents"]}
            labelFormatter={(v) =>
              new Date(v).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })
            }
          />

          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
