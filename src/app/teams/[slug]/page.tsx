"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import KpiCard from "@/components/KpiCard";
import DeploymentChart from "@/components/DeploymentChart";
import type { TeamDetail, TrendPoint } from "@/types";
import Breadcrumb from "@/components/Breadcrumb";
import { Layout, AlertCircle, Activity, ChevronRight } from "lucide-react";

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
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTeam(data);
      } catch {
        setTeamError("Failed to load team profile");
      } finally {
        setTeamLoading(false);
      }
    }

    async function loadTrends() {
      try {
        setTrendsLoading(true);
        setTrendsError(null);
        const res = await fetch(`/api/metrics/trends?metric=deployments&team=${params.slug}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setDeployTrends(data);
      } catch {
        setTrendsError("Failed to load deployment trends");
      } finally {
        setTrendsLoading(false);
      }
    }

    loadTeam();
    loadTrends();
  }, [params?.slug]);

  // ─── LOADING STATE ───
  if (teamLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium animate-pulse">Loading team profile...</p>
      </div>
    );
  }

  // ─── ERROR STATE ───
  if (teamError || !team) {
    return (
      <div className="p-12 text-center">
        <p className="text-rose-500 font-semibold">{teamError || "Team not found"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 lg:px-10 space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <header className="space-y-4">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: team.name || params?.slug }
          ]}
        />
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{team.name}</h1>
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
            {team.department} Department
          </p>
        </div>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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

      {/* CHART SECTION */}
      <section className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Activity size={18} className="text-indigo-500" />
            Deployment Trend
          </h2>
          <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded">Weekly View</span>
        </div>
        <DeploymentChart
          data={deployTrends}
          title=""
          loading={trendsLoading}
          error={trendsError}
        />
      </section>

      {/* REPOSITORIES TABLE */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Layout size={18} className="text-slate-400" />
          Repositories
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {team.repositories?.length ? (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Language</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Deploys (7d)</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">PRs (7d)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {team.repositories.map((repo) => (
                  <tr
                    key={repo.name}
                    onClick={() => router.push(`/teams/${params.slug}/repos/${encodeURIComponent(repo.name)}`)}
                    className="group hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                      <div className="flex items-center gap-2">
                        {repo.name}
                        <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
                        {repo.language || 'Native'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-slate-600 tabular-nums">{repo.deploys7d}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-slate-600 tabular-nums">{repo.prsMerged7d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-sm text-slate-400 font-medium italic">No active repositories found</div>
          )}
        </div>
      </section>

      {/* INCIDENTS TABLE */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <AlertCircle size={18} className="text-rose-500" />
          Recent Incidents
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {team.recentIncidents?.length ? (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Incident Title</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {team.recentIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{inc.title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        inc.severity === "critical" ? "bg-rose-50 text-rose-700 border-rose-100" :
                        inc.severity === "high" ? "bg-orange-50 text-orange-700 border-orange-100" :
                        inc.severity === "medium" ? "bg-amber-50 text-amber-700 border-amber-100" : 
                        "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-tighter">
                        <div className={`w-1.5 h-1.5 rounded-full ${inc.status === 'resolved' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                        {inc.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-slate-400 font-medium tabular-nums">
                      {new Date(inc.startedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-sm text-slate-400 font-medium italic">No recent incidents reported</div>
          )}
        </div>
      </section>
    </div>
  );
}