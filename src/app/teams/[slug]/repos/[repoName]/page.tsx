"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import KpiCard from "@/components/KpiCard";
import { DeploymentRange, RANGE_LABELS, TabId, TABS, type RepoDetail } from "@/types";
import DeploymentChart from "@/components/DeploymentChart";
import Breadcrumb from "@/components/Breadcrumb";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Database,
  ShieldCheck,
} from "lucide-react";

const PAGE_SIZE = 10;

export default function RepositoryDetailPage() {
  const { slug, repoName } = useParams<{ slug: string; repoName: string }>();

  const [repo, setRepo] = useState<RepoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("velocity");

  const [prPage, setPrPage] = useState(1);
  const [incidentPage, setIncidentPage] = useState(1);

  const [deploymentRange, setDeploymentRange] = useState<DeploymentRange>("7d");

  // Reset pagination only when the range changes — not on every fetch.
  useEffect(() => {
    setPrPage(1);
    setIncidentPage(1);
  }, [deploymentRange]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setNotFound(false);

    async function load() {
      try {
        const res = await fetch(
          `/api/teams/${slug}/repos/${repoName}?range=${deploymentRange}&prPage=${prPage}&incidentPage=${incidentPage}`,
          { signal: controller.signal }
        );

        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load repository (${res.status})`);
        }

        setRepo(await res.json());
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [slug, repoName, deploymentRange, prPage, incidentPage]);

  // Server already paginates these arrays.
  const paginatedPrs = repo?.mergedPullRequests ?? [];
  const paginatedIncidents = repo?.recentIncidents ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-10 text-slate-500 text-center font-medium">
        Repository not found.
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <p className="text-rose-600 font-medium mb-2">
          Failed to load repository
        </p>
        <p className="text-slate-500 text-sm mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!repo) return null;

  const activeIncidentsCount = repo.activeIncidentsTotal ?? 0;

  const totalPRs =
    repo.mergedPullRequestsTotal ?? repo.mergedPullRequests.length;
  const totalIncidents =
    repo.recentIncidentsTotal ?? repo.recentIncidents.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="space-y-4">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: repo.teamName || slug, href: `/teams/${slug}` },
            { label: repo.name },
          ]}
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              {repo.name}
            </h1>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold border border-indigo-100">
                <Database size={12} /> {repo.language || "Unknown"}
              </span>

              <span className="text-slate-400 text-sm font-medium">
                Part of {repo.teamName}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard title="Deployments (7d)" value={repo.deploys7d} />
        <KpiCard title="PRs Merged (7d)" value={repo.prsMerged7d} />
        <KpiCard
          title="Historical Incidents"
          value={totalIncidents}
          rangeLabel={RANGE_LABELS[deploymentRange]}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-sm">
          {Object.entries(RANGE_LABELS).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setDeploymentRange(id as DeploymentRange)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                deploymentRange === id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-sm font-bold ${
            activeIncidentsCount > 0
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              activeIncidentsCount > 0
                ? "bg-amber-500 animate-pulse"
                : "bg-emerald-500"
            }`}
          />
          {activeIncidentsCount > 0
            ? `${activeIncidentsCount} Active`
            : "Operational"}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 sm:p-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-sm font-bold transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-indigo-500/10 to-indigo-50 text-indigo-700 shadow-sm border border-indigo-100"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {activeTab === "velocity" && (
            <div className="p-4 sm:p-6 md:p-8">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-700">
                  Deployment Velocity
                </h2>
                <p className="text-xs text-slate-400">
                  Trend of deployments over selected range
                </p>
              </div>

              <div className="bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 rounded-2xl p-4 border border-indigo-100 shadow-sm">
                <DeploymentChart data={repo.deploymentHistory} />
              </div>
            </div>
          )}

          {activeTab === "prs" && (
            <div className="animate-in slide-in-from-bottom-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left table-fixed">
                  <thead className="bg-indigo-50/40 border-b border-indigo-100">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                        Pull Request
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedPrs.length === 0 ? (
                      <tr>
                        <td className="px-4 py-10 text-center text-sm text-slate-400">
                          No pull requests in this range.
                        </td>
                      </tr>
                    ) : (
                      paginatedPrs.map((pr) => (
                        <tr
                          key={pr.id}
                          className="hover:bg-indigo-50/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-slate-800 leading-snug">
                                {pr.title}
                              </p>

                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Clock
                                    size={12}
                                    className="text-slate-400"
                                  />
                                  {pr.mergedAt
                                    ? new Date(pr.mergedAt).toLocaleDateString(
                                        undefined,
                                        {
                                          year: "numeric",
                                          month: "short",
                                          day: "2-digit",
                                        }
                                      )
                                    : "—"}
                                </span>

                                <span className="flex items-center gap-1 font-mono">
                                  <span className="text-emerald-600 font-semibold">
                                    +{pr.additions}
                                  </span>
                                  <span className="text-rose-500 font-semibold">
                                    -{pr.deletions}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 flex items-center justify-between bg-slate-50/30 border-t border-slate-100">
                <p className="text-xs text-slate-400">Total: {totalPRs} PRs</p>
                <div className="flex gap-1">
                  <button
                    disabled={prPage === 1 || loading}
                    onClick={() => setPrPage((p) => p - 1)}
                    aria-label="Previous PR page"
                    className="p-2 rounded-lg border bg-white hover:bg-indigo-50 disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={prPage * PAGE_SIZE >= totalPRs || loading}
                    onClick={() => setPrPage((p) => p + 1)}
                    aria-label="Next PR page"
                    className="p-2 rounded-lg border bg-white hover:bg-indigo-50 disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "incidents" && (
            <div className="p-4 sm:p-6 md:p-8 animate-in slide-in-from-bottom-2">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-700">
                  Team-Level Incidents
                </h2>
                <p className="text-xs text-slate-400">
                  Incidents are tracked per team, not per repository. Showing
                  all incidents for {repo.teamName}.
                </p>
              </div>

              <div className="space-y-6 relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />

                {paginatedIncidents.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-400">
                    No incidents in this range.
                  </div>
                ) : (
                  paginatedIncidents.map((inc) => {
                    const status = inc.status ?? "unknown";

                    return (
                      <div
                        key={inc.id}
                        className="relative p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <h3 className="text-sm font-medium text-slate-900 leading-snug">
                                {inc.title}
                              </h3>

                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {new Date(inc.startedAt).toLocaleString()}
                                </span>

                                {inc.resolvedAt && (
                                  <span className="flex items-center gap-1 text-emerald-600">
                                    <ShieldCheck size={12} />
                                    Resolved{" "}
                                    {new Date(
                                      inc.resolvedAt
                                    ).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border ${
                                inc.severity === "critical"
                                  ? "text-rose-500 border-rose-200 bg-rose-50/40"
                                  : inc.severity === "high"
                                  ? "text-amber-600 border-amber-200 bg-amber-50/40"
                                  : inc.severity === "medium"
                                  ? "text-blue-600 border-blue-200 bg-blue-50/40"
                                  : "text-slate-500 border-slate-200 bg-slate-50"
                              }`}
                            >
                              {inc.severity}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span
                              className={`text-[11px] font-medium ${
                                inc.status === "resolved"
                                  ? "text-emerald-600"
                                  : "text-slate-500"
                              }`}
                            >
                              {status.toUpperCase()}
                            </span>

                            {inc.resolvedAt && (
                              <span className="text-[11px] text-slate-400">
                                MTTR{" "}
                                {Math.round(
                                  (new Date(inc.resolvedAt).getTime() -
                                    new Date(inc.startedAt).getTime()) /
                                    36e5
                                )}
                                h
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 flex items-center justify-between bg-slate-50/30 border-t border-slate-100 mt-6">
                <p className="text-xs text-slate-400">
                  Total: {totalIncidents}
                </p>
                <div className="flex gap-1">
                  <button
                    disabled={incidentPage === 1 || loading}
                    onClick={() => setIncidentPage((p) => p - 1)}
                    aria-label="Previous incident page"
                    className="p-2 rounded-lg border bg-white hover:bg-indigo-50 disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={
                      incidentPage * PAGE_SIZE >= totalIncidents || loading
                    }
                    onClick={() => setIncidentPage((p) => p + 1)}
                    aria-label="Next incident page"
                    className="p-2 rounded-lg border bg-white hover:bg-indigo-50 disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}