"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import KpiCard from "@/components/KpiCard";
import type { RepoDetail } from "@/types";
import DeploymentChart from "@/components/DeploymentChart";
import Breadcrumb from "@/components/Breadcrumb";
import {
  GitMerge,
  Activity,
  AlertCircle,
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
  const [activeTab, setActiveTab] = useState<"velocity" | "prs" | "incidents">(
    "velocity"
  );
  const [prPage, setPrPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/teams/${slug}/repos/${repoName}`);
        if (!res.ok) throw new Error("Not found");
        setRepo(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, repoName]);

  const paginatedPrs = useMemo(() => {
    if (!repo) return [];
    return repo.mergedPullRequests.slice(
      (prPage - 1) * PAGE_SIZE,
      prPage * PAGE_SIZE
    );
  }, [repo, prPage]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );

  if (!repo)
    return (
      <div className="p-10 text-slate-500 text-center font-medium">
        Repository not found.
      </div>
    );

  const activeIncidentsCount = repo.recentIncidents.filter(
    (i) => i.status !== "resolved"
  ).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ─── HEADER ─── */}
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

          <div
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border flex items-center gap-2 text-sm font-bold self-start md:self-end ${
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
              ? `${activeIncidentsCount} Active Incident(s)`
              : "Operational"}
          </div>
        </div>
      </header>

      {/* ─── KPI GRID ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Deployments (7d)"
          value={repo.deploys7d}
          loading={false}
        />
        <KpiCard
          title="PRs Merged (7d)"
          value={repo.prsMerged7d}
          loading={false}
        />
        <KpiCard
          title="Historical Incidents"
          value={repo.recentIncidents.length}
          loading={false}
        />
      </div>

      {/* ─── TABBED CONTENT ─── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 sm:p-2 overflow-x-auto">
          {[
            { id: "velocity", label: "Velocity", icon: Activity },
            { id: "prs", label: "Pull Requests", icon: GitMerge },
            { id: "incidents", label: "Incidents", icon: AlertCircle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-sm font-bold transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {/* 1. DEPLOYMENT HISTORY */}
          {activeTab === "velocity" && (
            <div className="p-4 sm:p-6 md:p-8 animate-in slide-in-from-bottom-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    Individual Deployment History
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Track production frequency over the last 14 days.
                  </p>
                </div>
              </div>
              <DeploymentChart data={repo.deploymentHistory} />
            </div>
          )}

          {/* 2. MERGED PRs */}
          {activeTab === "prs" && (
            <div className="animate-in slide-in-from-bottom-2">
              <div className="overflow-x-auto">
                {/* 
    Mobile  (< sm): 2 cols — Title + Lines
    Desktop (≥ sm): 3 cols — Title + Merged Date + Lines
  */}
                <table className="w-full text-left table-fixed">
                  <thead className="bg-slate-50/60 border-b border-slate-100">
                    <tr>
                      {/* Title — takes remaining space */}
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">
                        Title
                      </th>
                      {/* Hidden on mobile — not enough horizontal room */}
                      <th className="hidden sm:table-cell px-6 py-3 sm:py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right whitespace-nowrap w-[160px]">
                        Merged Date
                      </th>
                      {/* Always visible but compact on mobile */}
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right w-[80px] sm:w-[120px]">
                        Lines
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedPrs.map((pr) => (
                      <tr
                        key={pr.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        {/* Title cell — on mobile also shows date below the title */}
                        <td className="px-4 sm:px-6 py-3 sm:py-4 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                            {pr.title}
                          </p>
                          {/* Date shown inline under title on mobile only */}
                          <p className="mt-0.5 text-[11px] text-slate-400 sm:hidden">
                            {new Date(pr.mergedAt).toLocaleDateString(
                              undefined,
                              {
                                dateStyle: "medium",
                              }
                            )}
                          </p>
                        </td>

                        {/* Date column — hidden on mobile (shown in title cell instead) */}
                        <td className="hidden sm:table-cell px-6 py-3 sm:py-4 text-right text-xs text-slate-400 font-medium whitespace-nowrap">
                          {new Date(pr.mergedAt).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })}
                        </td>

                        {/* Lines badge */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                          <div className="inline-flex flex-col xs:flex-row items-end xs:items-center gap-0.5 xs:gap-1.5 font-mono text-[10px] font-bold">
                            <span className="text-emerald-600">
                              +{pr.additions}
                            </span>
                            <span className="text-rose-500">
                              -{pr.deletions}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 flex items-center justify-between bg-slate-50/30 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Total: {repo.mergedPullRequests.length} PRs
                </p>
                <div className="flex gap-1">
                  <button
                    disabled={prPage === 1}
                    onClick={() => setPrPage((p) => p - 1)}
                    aria-label="Previous page"
                    className="p-2 rounded-lg border bg-white disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={
                      prPage * PAGE_SIZE >= repo.mergedPullRequests.length
                    }
                    onClick={() => setPrPage((p) => p + 1)}
                    aria-label="Next page"
                    className="p-2 rounded-lg border bg-white disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. INCIDENT TIMELINE */}
          {activeTab === "incidents" && (
            <div className="p-4 sm:p-6 md:p-8 animate-in slide-in-from-bottom-2 duration-500">
              {repo.recentIncidents.length > 0 ? (
                <div className="space-y-6 relative">
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />
                  {repo.recentIncidents.map((inc) => {
                    const isResolved = inc.status === "resolved";
                    const startDate = new Date(inc.startedAt);
                    const endDate = inc.resolvedAt
                      ? new Date(inc.resolvedAt)
                      : null;

                    let durationText = "";
                    if (startDate && endDate) {
                      const diffInHours =
                        Math.abs(endDate.getTime() - startDate.getTime()) /
                        36e5;
                      durationText =
                        diffInHours < 1
                          ? `${Math.round(diffInHours * 60)}m to resolve`
                          : `${diffInHours.toFixed(1)}h to resolve`;
                    }

                    return (
                      <div key={inc.id} className="pl-8 relative">
                        <div
                          className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 transition-transform group-hover:scale-110 ${
                            isResolved
                              ? "bg-emerald-500"
                              : "bg-amber-400 animate-pulse"
                          }`}
                        />

                        <div
                          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                            isResolved
                              ? "bg-white border-slate-100 opacity-80"
                              : "bg-amber-50/30 border-amber-100 shadow-md ring-1 ring-amber-200/50"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                                <span
                                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                    inc.severity === "critical"
                                      ? "bg-red-100 text-red-700"
                                      : inc.severity === "high"
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {inc.severity}
                                </span>
                                <h3
                                  className={`text-sm font-bold ${
                                    isResolved
                                      ? "text-slate-700"
                                      : "text-slate-900"
                                  }`}
                                >
                                  {inc.title}
                                </h3>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[11px] font-medium text-slate-400">
                                <span className="flex items-center gap-1.5">
                                  <Clock size={12} />
                                  Started {startDate.toLocaleDateString()} at{" "}
                                  {startDate.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {isResolved && (
                                  <span className="flex items-center gap-1.5 text-emerald-600">
                                    <ShieldCheck size={12} />
                                    {durationText}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start">
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                                  isResolved
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : "bg-amber-100 text-amber-800 border-amber-200"
                                }`}
                              >
                                {inc.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                    <ShieldCheck size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-900 font-bold">System Clear</p>
                    <p className="text-slate-400 text-xs">
                      No incidents recorded in the database for this repository.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
