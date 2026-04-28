"use client";

import { useEffect, useState } from "react";
import { useDateRange } from "@/hooks/useDateRange";
import DateRangePicker from "@/components/DateRangePicker";
import type { TeamDetail, TrendPoint } from "@/types";
import TeamSelector from "@/components/compare/TeamSelector";
import CompareKpiGrid from "@/components/compare/CompareKpiGrid";
import CompareCharts from "@/components/compare/CompareCharts";
import { EmptyState, SkeletonGrid } from "@/components/compare/CompareStates";
import { Calendar, Users, X, Info, Layers } from "lucide-react";

// ─── NEW PROFESSIONAL PALETTE ───
const MODERN_COLORS = ["#4F46E5", "#0EA5E9", "#64748B"]; // Indigo, Sky, Slate
const MODERN_LIGHTS = ["#EEF2FF", "#F0F9FF", "#F8FAFC"];

export default function ComparePage() {
  const { from, to, setRange } = useDateRange();
  const [allTeams, setAllTeams] = useState<{ slug: string; name: string }[]>(
    []
  );
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [teamDetails, setTeamDetails] = useState<TeamDetail[]>([]);
  const [deployTrends, setDeployTrends] = useState<
    Record<string, TrendPoint[]>
  >({});
  const [incidentTrends, setIncidentTrends] = useState<
    Record<string, TrendPoint[]>
  >({});
  const [loading, setLoading] = useState(false);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  useEffect(() => {
    fetch(`/api/teams?page=1&pageSize=100&search=&from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) =>
        setAllTeams(
          (d.data ?? []).map((t: any) => ({ slug: t.slug, name: t.name }))
        )
      );
  }, []);

  useEffect(() => {
    if (selectedSlugs.length === 0) {
      setTeamDetails([]);
      setDeployTrends({});
      setIncidentTrends({});
      return;
    }
    setLoading(true);
    Promise.all(
      selectedSlugs.map(async (slug) => {
        const [detail, deploys, incidents] = await Promise.all([
          fetch(`/api/teams/${slug}?from=${from}&to=${to}`).then((r) =>
            r.json()
          ),
          fetch(
            `/api/metrics/trends?metric=deployments&from=${from}&to=${to}&team=${slug}`
          ).then((r) => r.json()),
          fetch(
            `/api/metrics/trends?metric=incidents&from=${from}&to=${to}&team=${slug}`
          ).then((r) => r.json()),
        ]);
        return { slug, detail, deploys, incidents };
      })
    )
      .then((results) => {
        setTeamDetails(results.map((r) => r.detail));
        setDeployTrends(
          Object.fromEntries(results.map((r) => [r.slug, r.deploys]))
        );
        setIncidentTrends(
          Object.fromEntries(results.map((r) => [r.slug, r.incidents]))
        );
      })
      .finally(() => setLoading(false));
  }, [selectedSlugs, from, to]);

  const teamsWithColor = teamDetails.map((d, i) => ({
    detail: d,
    color: MODERN_COLORS[i],
    lightColor: MODERN_LIGHTS[i],
  }));

  return (
    <div className="min-h-screen bg-slate-50/50 px-6 py-8 lg:px-12 lg:py-10 selection:bg-indigo-100">
      <div className="mx-auto max-w-7xl space-y-10 animate-in fade-in duration-500">
        {/* ─── HEADER ─── */}
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">
              <Layers size={14} />
              Cross-Team Analysis
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 leading-tight">
              Comparison Hub
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <Calendar size={16} className="text-slate-400 ml-2" />
            <span className="text-sm font-bold text-slate-700 tabular-nums pr-2 border-r border-slate-100">
              {fmt(from)} — {fmt(to)}
            </span>
            <DateRangePicker from={from} to={to} onChange={setRange} />
          </div>
        </header>

        {/* ─── SELECTION CARD ─── */}
        <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 ring-1 ring-slate-50">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Select Teams
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Add 2 or 3 teams to view comparative performance
              </p>
            </div>
            {selectedSlugs.length > 0 && (
              <button
                onClick={() => setSelectedSlugs([])}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all border-b border-transparent hover:border-slate-300 pb-0.5"
              >
                Reset All
              </button>
            )}
          </div>

          <TeamSelector
            allTeams={allTeams}
            selected={selectedSlugs}
            onChange={setSelectedSlugs}
            loading={allTeams.length === 0} // It's loading if we have no teams yet
          />
          {selectedSlugs.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-100 flex gap-4 flex-wrap">
              {teamsWithColor.map(({ detail, color }, i) => (
                <div
                  key={detail.slug}
                  className="group flex items-center gap-4 bg-white rounded-2xl px-5 py-3 shadow-sm border border-slate-100 transition-all hover:shadow-md"
                >
                  <div
                    className="w-1.5 h-8 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      Team 0{i + 1}
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {detail.name}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSelectedSlugs((prev) =>
                        prev.filter((s) => s !== detail.slug)
                      )
                    }
                    className="ml-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── CONTENT AREA ─── */}
        <div className="min-h-[400px]">
          {selectedSlugs.length < 2 ? (
            <div className="animate-in fade-in duration-700">
              <EmptyState />
            </div>
          ) : loading ? (
            <SkeletonGrid />
          ) : (
            <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-700">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-widest w-fit border border-indigo-100">
                <Info size={12} /> Live Comparative Breakdown
              </div>

              <div className="space-y-10">
                {/* KPI Grid uses the colors internally via props */}
                <CompareKpiGrid teams={teamsWithColor} />

                {/* Charts Area */}
                <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <CompareCharts
                    teams={teamsWithColor}
                    deployTrends={deployTrends}
                    incidentTrends={incidentTrends}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
