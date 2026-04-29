"use client";

import { formatNumber, formatHours } from "@/lib/utils";
import { SEVERITY_CONFIG, SeverityFilter } from "@/lib/severity";
import {
  BarChart2,
  Clock,
  GitMerge,
  AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: number;
  format?: "number" | "hours";
  severity?: SeverityFilter;
  loading?: boolean;
  error?: string | null;
}

const ICONS: Record<string, LucideIcon> = {
  "Total Deployments": BarChart2,
  "Deployments (7d)": BarChart2,
  "Cycle Lead Time": Clock,
  "PR Throughput": GitMerge,
  "PRs Merged (7d)": GitMerge,
  "Recorded Incidents": AlertTriangle,
  "Incidents (7d)": AlertTriangle,
};

export default function KpiCard({
  title,
  value,
  format = "number",
  severity,
  loading,
  error,
}: KpiCardProps) {
  // ✅ LOADING STATE
  if (loading) {
    return (
      <div className="h-32 w-full animate-pulse rounded-2xl bg-slate-100" />
    );
  }

  // ❌ ERROR STATE
  if (error) {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700 animate-in fade-in">
        Failed to load {title.toLowerCase()}
      </div>
    );
  }

  const display = format === "hours" ? formatHours(value) : formatNumber(value);
  const severityConfig = severity ? SEVERITY_CONFIG[severity] : null;
  const Icon = ICONS[title];

  return (
    <div className="flex h-32 w-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md animate-in fade-in">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Icon size={20} strokeWidth={2.5} />
            </div>
          )}
          <p className="text-base font-bold text-slate-800">{title}</p>
        </div>
        {severityConfig && (
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 ring-inset ${severityConfig.bgClass} ${severityConfig.textClass} ${severityConfig.ringClass}`}>
            {severityConfig.label}
          </span>
        )}
      </div>
      <p className="text-4xl font-bold tracking-tight text-slate-900">
        {display}
      </p>
    </div>
  );
}
