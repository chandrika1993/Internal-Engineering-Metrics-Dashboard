"use client";

import { Fragment, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import KpiCard from "@/components/KpiCard";
import DeploymentChart from "@/components/DeploymentChart";
import IncidentChart from "@/components/IncidentChart";
import TeamsTable from "@/components/TeamsTable";
import FilterBar from "@/components/FilterBar";
import type { OverviewMetrics, TrendPoint, TeamWithStats } from "@/types";
import { SEVERITY_CONFIG, SeverityFilter } from "@/lib/severity";
import { PAGE_SIZE } from "@/lib/utils";
import { SortingState } from "@tanstack/react-table";
import { useDateRange } from "@/hooks/useDateRange";
import DateRangePicker from "@/components/DateRangePicker";
import { CalendarIcon, Filter, LayoutDashboard, Settings2 } from "lucide-react";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [deployTrends, setDeployTrends] = useState<TrendPoint[]>([]);
  const [incidentTrends, setIncidentTrends] = useState<TrendPoint[]>([]);
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [debouncedValue] = useDebounce(searchQuery, 150);

  const displayedIncidentCount = incidentTrends
    .filter((p) => severity === "all" || p.severity === severity)
    .reduce((sum, p) => sum + p.value, 0);

  const [metricsLoading, setMetricsLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);

  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { from, to, setRange } = useDateRange();

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  const rangeLabel = `${fmt(from)} — ${fmt(to)}`;

  async function loadTeams(
    currentPage: number,
    currentSorting: SortingState,
    search: string,
    from: string,
    to: string
  ) {
    try {
      setTeamsLoading(true);
      setTeamsError(null);
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(PAGE_SIZE),
        search,
        from,
        to,
        ...(currentSorting[0] && {
          sortBy: currentSorting[0].id,
          sortDir: currentSorting[0].desc ? "desc" : "asc",
        }),
      });
      const res = await fetch(`/api/teams?${params}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setTeams(data.data ?? []);
      setTotalCount(data.totalCount ?? 0);
    } catch (err) {
      setTeamsError("Failed to load teams data");
    } finally {
      setTeamsLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [debouncedValue, sorting, from, to]);
  useEffect(() => {
    loadTeams(page, sorting, debouncedValue, from, to);
  }, [page, sorting, debouncedValue, from, to]);

  useEffect(() => {
    async function loadMetrics() {
      try {
        setMetricsLoading(true);
        const res = await fetch(`/api/metrics/overview?from=${from}&to=${to}`);
        setMetrics(await res.json());
      } catch {
        setMetricsError("Failed to load metrics");
      } finally {
        setMetricsLoading(false);
      }
    }

    async function loadTrends() {
      try {
        setTrendsLoading(true);
        const [deployments, incidents] = await Promise.all([
          fetch(
            `/api/metrics/trends?metric=deployments&from=${from}&to=${to}`
          ).then((r) => r.json()),
          fetch(
            `/api/metrics/trends?metric=incidents&from=${from}&to=${to}`
          ).then((r) => r.json()),
        ]);
        setDeployTrends(deployments);
        setIncidentTrends(incidents);
      } catch {
        setTrendsError("Failed to load trends");
      } finally {
        setTrendsLoading(false);
      }
    }

    loadMetrics();
    loadTrends();
  }, [from, to]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-6 py-8 lg:px-12 lg:py-10 selection:bg-indigo-100">
      <div className="mx-auto max-w-7xl space-y-12">
        {/* ─── HEADER ─── */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
              <LayoutDashboard size={14} />
              Engineering Intelligence
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Overview
            </h1>
            <div className="flex items-center gap-2">
              {["Delivery", "Incidents", "Velocity"].map((label, i, arr) => (
                <Fragment key={label}>
                  <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 shadow-sm rounded-full px-2.5 py-0.5">
                    {label}
                  </span>
                </Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2 text-slate-600">
              <CalendarIcon size={16} className="text-slate-400" />
              <span className="text-sm font-semibold tabular-nums">
                {rangeLabel}
              </span>
            </div>
            <DateRangePicker from={from} to={to} onChange={setRange} />
          </div>
        </header>

        {/* ─── KPI SECTION ─── */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            loading={metricsLoading}
            error={metricsError}
            title="Total Deployments"
            value={metrics?.deploymentsPerWeek ?? 0}
          />
          <KpiCard
            loading={metricsLoading}
            error={metricsError}
            title="Cycle Lead Time"
            value={metrics?.leadTimeHours ?? 0}
            format="hours"
          />
          <KpiCard
            loading={metricsLoading}
            error={metricsError}
            title="PR Throughput"
            value={metrics?.prThroughput ?? 0}
          />
          <KpiCard
            loading={metricsLoading}
            error={metricsError}
            title="Recorded Incidents"
            value={displayedIncidentCount}
            severity={severity}
          />
        </section>

        {/* ─── CHARTS SECTION ─── */}
        <section className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {/* Deployment History */}
          <div className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Deployment History
                </h2>
                <p className="text-sm font-medium text-slate-400">
                  Frequency per weekly interval
                </p>
              </div>
              <div className="bg-slate-50 px-3 py-1 rounded-lg text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                Live Data
              </div>
            </div>
            <DeploymentChart
              loading={trendsLoading}
              error={trendsError}
              data={deployTrends}
              title=""
            />
          </div>

          {/* Incident Severity */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Incident Distribution
                </h2>
                <p className="text-sm font-medium text-slate-400">
                  Volume by severity level
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
                {(Object.keys(SEVERITY_CONFIG) as SeverityFilter[]).map(
                  (level) => (
                    <button
                      key={level}
                      onClick={() => setSeverity(level)}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                        severity === level
                          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {SEVERITY_CONFIG[level].label}
                    </button>
                  )
                )}
              </div>
            </div>

            <IncidentChart
              loading={trendsLoading}
              error={trendsError}
              data={incidentTrends}
              severity={severity}
              from={from}
              to={to}
            />
          </div>
        </section>

        {/* ─── TEAMS SECTION ─── */}
        <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 ring-1 ring-slate-50">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                Team Performance
              </h2>
              <p className="text-sm font-medium text-slate-400">
                Detailed breakdown of engineering metrics by team
              </p>
            </div>

            <div className="w-full lg:w-[360px] flex items-center gap-3">
              <div className="flex-1">
                <FilterBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </div>
              <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 rounded-lg border border-slate-100">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <TeamsTable
              loading={teamsLoading}
              error={teamsError}
              data={teams}
              searchQuery={debouncedValue}
              onSortChange={setSorting}
              sorting={sorting}
              page={page}
              totalPages={Math.ceil(totalCount / PAGE_SIZE) || 1}
              onPageChange={setPage}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
