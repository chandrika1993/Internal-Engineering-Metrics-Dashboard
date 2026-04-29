'use client';

import { Fragment, useState } from 'react';
import { useDebounce } from 'use-debounce';
import KpiCard from '@/components/KpiCard';
import DeploymentChart from '@/components/DeploymentChart';
import IncidentChart from '@/components/IncidentChart';
import TeamsTable from '@/components/TeamsTable';
import FilterBar from '@/components/FilterBar';
import { SEVERITY_CONFIG, SeverityFilter } from '@/lib/severity';
import { PAGE_SIZE } from '@/lib/utils';
import { useDateRange } from '@/hooks/useDateRange';
import { useMetrics } from '@/hooks/useMetrics';
import { useTrends } from '@/hooks/useTrends';
import { useTeams } from '@/hooks/useTeams';
import DateRangePicker from '@/components/DateRangePicker';
import { CalendarIcon, LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [debouncedValue] = useDebounce(searchQuery, 300);

  const { from, to, setRange } = useDateRange();

  const {
    teams,
    teamsLoading,
    teamsError,
    sorting,
    setSorting,
    page,
    setPage,
    totalCount,
    departments,
  } = useTeams(debouncedValue, department, from, to);

  const { metrics, loading: metricsLoading, error: metricsError } = useMetrics(from, to, severity);
  const { trends: deployTrends, loading: deployTrendsLoading, error: deployTrendsError } = useTrends('deployments', from, to);
  const { trends: incidentTrends, loading: incidentTrendsLoading, error: incidentTrendsError } = useTrends('incidents', from, to, severity);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
    });
  const rangeLabel = `${fmt(from)} — ${fmt(to)}`;

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500">
      {/* ─── HEADER ─── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
            <LayoutDashboard size={14} />
            Engineering Intelligence
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            {['Delivery', 'Incidents', 'Velocity'].map((label) => (
              <Fragment key={label}>
                <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 shadow-sm rounded-full px-2.5 py-0.5">
                  {label}
                </span>
              </Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end xs:justify-between gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="hidden xs:flex items-center gap-2 px-3 py-2 text-slate-600">
            <CalendarIcon size={16} className="text-slate-400" />
            <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
              {rangeLabel}
            </span>
          </div>
          <DateRangePicker from={from} to={to} onChange={setRange} />
        </div>
      </header>

      {/* ─── KPI SECTION ─── */}
      <section aria-labelledby="kpi-title" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
        <h2 id="kpi-title" className="sr-only">Key Performance Indicators</h2>
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
          value={metrics?.incidentCount ?? 0}
          severity={severity}
        />
      </section>

      {/* ─── CHARTS SECTION ─── */}
      <section aria-labelledby="charts-title" className="grid grid-cols-1 gap-8 xl:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
        {/* Deployment History */}
        <div className="group rounded-3xl border border-slate-200 bg-white p-4 md:p-8 shadow-sm transition-all hover:shadow-md">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 id="charts-title" className="text-xl font-bold text-slate-900">
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
            loading={deployTrendsLoading}
            error={deployTrendsError}
            data={deployTrends}
          />
        </div>

        {/* Incident Severity */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 md:p-8 shadow-sm space-y-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Incident Distribution
              </h2>
              <p className="text-sm font-medium text-slate-400">
                Volume by severity level
              </p>
            </div>

            <div role="radiogroup" className="flex items-center flex-wrap gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
              {(Object.keys(SEVERITY_CONFIG) as SeverityFilter[]).map(
                (level) => (
                  <button
                    key={level}
                    role="radio"
                    aria-checked={severity === level}
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
            loading={incidentTrendsLoading}
            error={incidentTrendsError}
            data={incidentTrends}
            severity={severity}
            from={from}
            to={to}
          />
        </div>
      </section>

      {/* ─── TEAMS SECTION ─── */}
      <section aria-labelledby="teams-title" className="rounded-3xl bg-white p-4 md:p-8 shadow-sm border border-slate-200 ring-1 ring-slate-50 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h2 id="teams-title" className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Team Performance
            </h2>
            <p className="text-sm font-medium text-slate-400">
              Detailed breakdown of team metrics for {rangeLabel}
            </p>
          </div>

          <div className="w-full lg:w-auto">
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              departments={departments}
              currentDepartment={department}
              onDepartmentChange={setDepartment}
            />
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
            onPageChange={(page) => setPage(page)}
          />
        </div>
      </section>
    </div>
  );
}
