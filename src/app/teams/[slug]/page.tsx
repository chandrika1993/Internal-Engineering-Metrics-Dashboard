"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import KpiCard from "@/components/KpiCard";
import DeploymentChart from "@/components/DeploymentChart";
import type { TeamDetail, TrendPoint } from "@/types";
import Breadcrumb from "@/components/Breadcrumb";
import {
  Layout,
  AlertCircle,
  Activity,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

// This is the main detail page for a specific team.
// It fetches and displays team-specific data, including KPIs, deployment trends,
// a list of repositories, and recent incidents.
export default function TeamDetailPage() {
  // ─── HOOKS ───
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  // ─── STATE MANAGEMENT ───
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [deployTrends, setDeployTrends] = useState<TrendPoint[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  // ─── DATA FETCHING ───
  useEffect(() => {
    if (!params?.slug) return;

    // Fetches the main team details from the API.
    async function loadTeam() {
      try {
        setTeamLoading(true);
        setTeamError(null);
        const res = await fetch(`/api/teams/${params.slug}`);
        if (!res.ok) throw new Error("Team data could not be fetched.");
        setTeam(await res.json());
      } catch (err: any) {
        setTeamError(err.message || "Failed to load team profile");
      } finally {
        setTeamLoading(false);
      }
    }

    // Fetches the deployment trend data for the team.
    async function loadTrends() {
      try {
        setTrendsLoading(true);
        setTrendsError(null);
        const res = await fetch(
          `/api/metrics/trends?metric=deployments&team=${params.slug}`
        );
        if (!res.ok) throw new Error("Deployment trends could not be loaded.");
        setDeployTrends(await res.json());
      } catch (err: any) {
        setTrendsError(err.message || "Failed to load deployment trends");
      } finally {
        setTrendsLoading(false);
      }
    }

    loadTeam();
    loadTrends();
  }, [params?.slug]);

  // ─── RENDER STATES ───

  // Loading state for the main team data.
  if (teamLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 p-8">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium animate-pulse">
          Loading team profile…
        </p>
      </div>
    );
  }

  // Error state if team data fails to load or doesn't exist.
  if (teamError || !team) {
    return (
      <div className="p-8 text-center">
        <p className="text-rose-500 font-semibold text-sm">
          {teamError || "Team not found"}
        </p>
      </div>
    );
  }

  // ─── MAIN RENDER ───
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header: Breadcrumbs and Title */}
      <header className="space-y-3">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: team.name || params?.slug },
          ]}
        />
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 truncate">
            {team.name}
          </h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            {team.department} Department
          </p>
        </div>
      </header>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 xs:grid-cols-3 gap-4">
        <KpiCard
          loading={teamLoading}
          error={teamError}
          title="Deployments (7d)"
          value={team.metrics.deploymentsPerWeek}
        />
        <KpiCard
          loading={teamLoading}
          error={teamError}
          title="PRs Merged (7d)"
          value={team.metrics.prThroughput}
        />
        <KpiCard
          loading={teamLoading}
          error={teamError}
          title="Incidents (7d)"
          value={team.metrics.incidentCount}
        />
      </div>

      {/* Deployment Trend Chart */}
      <section className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[28px] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Activity size={16} className="text-indigo-500 shrink-0" />
            Deployment Trend
          </h2>
          <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 whitespace-nowrap">
            Weekly View
          </span>
        </div>
        <DeploymentChart
          data={deployTrends}
          loading={trendsLoading}
          error={trendsError}
        />
      </section>

      {/* Repositories Table */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Layout size={16} className="text-slate-400 shrink-0" />
          Repositories
        </h2>

        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {team.repositories?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left table-fixed">
                <thead className="bg-slate-50/60 border-b border-slate-100">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">
                      Name
                    </th>
                    <th className="hidden xs:table-cell px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[100px] sm:w-[120px]">
                      Language
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right w-[70px] sm:w-[110px] whitespace-nowrap">
                      Deploys
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right w-[90px]">
                      PRs (7d)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {team.repositories.map((repo) => (
                    <tr
                      key={repo.name}
                      onClick={() =>
                        router.push(
                          `/teams/${params.slug}/repos/${encodeURIComponent(
                            repo.name
                          )}`
                        )
                      }
                      className="group hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors truncate">
                            {repo.name}
                          </span>
                          <ChevronRight
                            size={13}
                            className="text-slate-300 group-hover:translate-x-0.5 transition-transform shrink-0"
                          />
                        </div>
                        <p className="xs:hidden mt-0.5 text-[11px] text-slate-400 font-medium">
                          {repo.language || "Native"} &nbsp;·&nbsp;{" "}
                          {repo.prsMerged7d} PRs
                        </p>
                      </td>

                      <td className="hidden xs:table-cell px-4 sm:px-6 py-4">
                        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
                          {repo.language || "Native"}
                        </span>
                      </td>

                      <td className="px-3 sm:px-6 py-4 text-sm text-right font-medium text-slate-600 tabular-nums">
                        {repo.deploys7d}
                      </td>

                      <td className="hidden sm:table-cell px-6 py-4 text-sm text-right font-medium text-slate-600 tabular-nums">
                        {repo.prsMerged7d}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-400 font-medium italic">
              No active repositories found for this team.
            </div>
          )}
        </div>
      </section>

      {/* Recent Incidents Table */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-500 shrink-0" />
          Recent Incidents
        </h2>

        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {team.recentIncidents?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left table-fixed">
                <thead className="bg-slate-50/60 border-b border-slate-100">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Incident
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[80px] sm:w-[100px]">
                      Severity
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[100px]">
                      Status
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right w-[110px]">
                      Started
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {team.recentIncidents.map((inc) => (
                    <tr
                      key={inc.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4 min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate">
                          {inc.title}
                        </p>
                        <div className="sm:hidden mt-0.5 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                          <div
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              inc.status === "resolved"
                                ? "bg-emerald-500"
                                : "bg-amber-400 animate-pulse"
                            }`}
                          />
                          <span className="capitalize">{inc.status}</span>
                          <span>·</span>
                          <span>
                            {new Date(inc.startedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 sm:px-6 py-4">
                        <span
                          className={`inline-block px-1.5 sm:px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${
                            inc.severity === "critical"
                              ? "bg-rose-50 text-rose-700 border-rose-100"
                              : inc.severity === "high"
                              ? "bg-orange-50 text-orange-700 border-orange-100"
                              : inc.severity === "medium"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>

                      <td className="hidden sm:table-cell px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-tighter">
                          <div
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              inc.status === "resolved"
                                ? "bg-emerald-500"
                                : "bg-amber-400 animate-pulse"
                            }`}
                          />
                          {inc.status}
                        </div>
                      </td>

                      <td className="hidden sm:table-cell px-6 py-4 text-sm text-right text-slate-400 font-medium tabular-nums whitespace-nowrap">
                        {new Date(inc.startedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 sm:py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                <ShieldCheck size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-bold">All Clear</p>
                <p className="text-slate-400 text-xs px-4">
                  No incidents have been recorded for this team recently.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
