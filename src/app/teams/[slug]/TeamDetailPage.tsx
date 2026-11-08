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

export default function TeamDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [deployTrends, setDeployTrends] = useState<TrendPoint[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.slug) return;

    async function loadTeam() {
      try {
        setTeamLoading(true);
        setTeamError(null);
        const res = await fetch(`/api/teams/${params.slug}`);
        if (!res.ok) throw new Error("Failed to load team");
        setTeam(await res.json());
      } catch (err: any) {
        setTeamError(err.message);
      } finally {
        setTeamLoading(false);
      }
    }

    async function loadTrends() {
      try {
        setTrendsLoading(true);
        setTrendsError(null);
        const res = await fetch(
          `/api/metrics/trends?metric=deployments&team=${params.slug}`
        );
        if (!res.ok) throw new Error("Failed to load trends");
        setDeployTrends(await res.json());
      } catch (err: any) {
        setTrendsError(err.message);
      } finally {
        setTrendsLoading(false);
      }
    }

    loadTeam();
    loadTrends();
  }, [params?.slug]);

  if (teamLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
          <p className="text-sm">Loading team…</p>
        </div>
      </div>
    );
  }

  if (teamError || !team) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-rose-500 font-medium">
        {teamError || "Team not found"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* HEADER */}
        <header className="space-y-4">
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/" },
              { label: team.name || params?.slug },
            ]}
          />

          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
              {team.name}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="px-2 py-0.5 bg-slate-100 rounded-full font-medium">
                {team.department}
              </span>
              <span>Team Overview</span>
            </div>
          </div>
        </header>

        {/* KPI GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          <KpiCard
            title="Cycle Lead Time"
            value={team.metrics.leadTimeHours}
            format="hours"
          />
          <KpiCard
            title="Deployments (7d)"
            value={team.metrics.deploymentsPerWeek}
          />
          <KpiCard title="PRs Merged (7d)" value={team.metrics.prThroughput} />
          <KpiCard title="Incidents (7d)" value={team.metrics.incidentCount} />
        </section>

        {/* DEPLOYMENT CHART */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-800">
              <Activity size={16} />
              Deployment Trend
            </h2>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
              Weekly
            </span>
          </div>

          <div className="p-6">
            <DeploymentChart
              data={deployTrends}
              loading={trendsLoading}
              error={trendsError}
            />
          </div>
        </section>

        {/* REPOSITORIES */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Layout size={16} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-800">
              Repositories
            </h2>
          </div>

          {team.repositories?.length ? (
            <div className="divide-y divide-slate-100">
              {team.repositories.map((repo) => (
                <div
                  key={repo.name}
                  onClick={() =>
                    router.push(
                      `/teams/${params.slug}/repos/${encodeURIComponent(
                        repo.name
                      )}`
                    )
                  }
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer transition group"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate group-hover:text-indigo-600">
                      {repo.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {repo.language || "Native"}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-slate-500">
                    <span>{repo.deploys7d} deploys</span>
                    <span>{repo.prsMerged7d} PRs</span>
                    <ChevronRight
                      size={14}
                      className="text-slate-300 group-hover:translate-x-1 transition"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-slate-400 text-sm">
              No repositories found
            </div>
          )}
        </section>

        {/* INCIDENTS */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-500" />
            <h2 className="text-sm font-semibold text-slate-800">
              Recent Incidents
            </h2>
          </div>

          {team.recentIncidents?.length ? (
            <div className="divide-y divide-slate-100">
              {team.recentIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="px-6 py-4 flex items-start justify-between hover:bg-slate-50 transition"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">
                      {inc.title}
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          inc.status === "resolved"
                            ? "bg-emerald-500"
                            : "bg-amber-400 animate-pulse"
                        }`}
                      />
                      <span>{inc.status}</span>
                      <span>•</span>
                      <span>
                        {new Date(inc.startedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] px-2 py-1 rounded-full font-semibold uppercase border ${
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
                </div>
              ))}
            </div>
          ) : (
            <div className="py-14 flex flex-col items-center text-center text-slate-400">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mb-2" />
              <p className="font-medium text-slate-900">All Clear</p>
              <p className="text-xs mt-1">
                No incidents reported for this team.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
