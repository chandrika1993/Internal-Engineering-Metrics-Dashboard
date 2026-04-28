"use client";

import { formatNumber, formatHours } from "@/lib/utils";
import { SEVERITY_CONFIG, SeverityFilter } from "@/lib/severity";
interface KpiCardProps {
  title: string;
  value: number;
  format?: "number" | "hours";
  subtitle?: string;
  severity?: SeverityFilter;
  loading?: boolean;
  error?: string | null;
}

export default function KpiCard({
  title,
  value,
  format = "number",
  subtitle,
  severity,
  loading,
  error,
}: KpiCardProps) {
  if (loading) {
    return <div className="h-24 animate-pulse rounded-xl bg-gray-200" />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load {title.toLowerCase()}
      </div>
    );
  }
  const display = format === "hours" ? formatHours(value) : formatNumber(value);
  const severityStyle = severity ? SEVERITY_CONFIG[severity] : null;

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-6 ${
        severityStyle ? severityStyle.borderClass : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {severityStyle && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {severityStyle.label}
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">{display}</p>
      {subtitle && <p className="mt-1 text-sm text-gray-400">{subtitle}</p>}
    </div>
  );
}
