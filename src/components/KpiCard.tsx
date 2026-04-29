"use client";

import { formatNumber, formatHours } from "@/lib/utils";
import { SEVERITY_CONFIG, SeverityFilter } from "@/lib/severity";
import { BarChart2, Clock, GitMerge, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: number;
  format?: "number" | "hours";
  severity?: SeverityFilter;
  rangeLabel?: string;
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
  rangeLabel,
  loading,
  error,
}: KpiCardProps) {
  if (loading) {
    return (
      <div className="h-32 w-full animate-pulse rounded-2xl bg-slate-100" />
    );
  }

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
    <div className="group relative flex h-32 w-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
              <Icon size={20} strokeWidth={2.5} />
            </div>
          )}

          <div className="flex flex-col leading-tight">
            <p className="text-sm font-semibold text-slate-800">{title}</p>

            {rangeLabel && (
              <span className="mt-1 inline-flex w-fit items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                {rangeLabel}
              </span>
            )}
          </div>
        </div>

        {severityConfig && (
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-full ring-1 ring-inset whitespace-nowrap ${severityConfig.bgClass} ${severityConfig.textClass} ${severityConfig.ringClass}`}
          >
            {severityConfig.label}
          </span>
        )}
      </div>

      {/* VALUE */}
      <div className="flex items-end justify-between">
        <p className="text-3xl font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600">
          {display}
        </p>
      </div>
    </div>
  );
}
