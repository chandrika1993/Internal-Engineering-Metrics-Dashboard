"use client";

import { useEffect, useState } from "react";
import { useDateRange } from "@/hooks/useDateRange";
import DateRangePicker from "@/components/DateRangePicker";
import type { TeamDetail, TrendPoint } from "@/types";
import TeamSelector from "@/components/compare/TeamSelector";
import CompareKpiGrid from "@/components/compare/CompareKpiGrid";
import CompareCharts from "@/components/compare/CompareCharts";
import { EmptyState, SkeletonGrid } from "@/components/compare/CompareStates";
import { Calendar, X, Info, Layers } from "lucide-react";

const MODERN_COLORS = ["#4F46E5", "#0EA5E9", "#64748B"];
const MODERN_LIGHTS = ["#EEF2FF", "#F0F9FF", "#F8FAFC"];

export default function ComparePage() {
  const { from, to, setRange } = useDateRange();
  const [allTeams, setAllTeams] = useState<{ slug: string; name: string }[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [teamDetails, setTeamDetails] = useState<TeamDetail[]>([]);
  const [deployTrends, setDeployTrends] = useState<Record<string, TrendPoint[]>>({});
  const [incidentTrends, setIncidentTrends] = useState<Record<string, TrendPoint[]>>({});
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
          fetch(`/api/teams/${slug}?from=${from}&to=${to}`).then((r) => r.json()),
          fetch(`/api/metrics/trends?metric=deployments&from=${from}&to=${to}&team=${slug}`).then((r) => r.json()),
          fetch(`/api/metrics/trends?metric=incidents&from=${from}&to=${to}&team=${slug}`).then((r) => r.json()),
        ]);
        return { slug, detail, deploys, incidents };
      })
    )
      .then((results) => {
        setTeamDetails(results.map((r) => r.detail));
        setDeployTrends(Object.fromEntries(results.map((r) => [r.slug, r.deploys])));
        setIncidentTrends(Object.fromEntries(results.map((r) => [r.slug, r.incidents])));
      })
      .finally(() => setLoading(false));
  }, [selectedSlugs, from, to]);

  const teamsWithColor = teamDetails.map((d, i) => ({
    detail: d,
    color: MODERN_COLORS[i],
    lightColor: MODERN_LIGHTS[i],
  }));

  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-10 animate-in fade-in duration-500">
      {/* ── HEADER ── */}
      <header className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
        {/* Left: eyebrow + title */}
        <div className="space-y-1 sm:space-y-2 min-w-0">
          <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
            <Layers size={12} className="shrink-0" />
            <span>Cross-Team Analysis</span>
          </div>
          {/* 
      320px → 22px
      375px → 26px
      640px → 30px
      1024px+ → 36px
    */}
          <h1 className="text-[22px] xs:text-[26px] sm:text-[30px] lg:text-[36px] font-bold tracking-tight text-slate-900 leading-tight truncate">
            Comparison Hub
          </h1>
        </div>

        {/* Right: date range — stacks below title on small phones */}
        <div className="flex items-center gap-2 bg-white pl-3 pr-2 py-2 rounded-xl border border-slate-200 shadow-sm self-start lg:self-end shrink-0">
          <Calendar size={14} className="text-slate-400 shrink-0" />
          {/* Hide the date text on the smallest phones (320px) to avoid overflow */}
          <span className="hidden xs:block text-xs sm:text-sm font-semibold text-slate-700 tabular-nums pr-2 border-r border-slate-100 whitespace-nowrap">
            {fmt(from)} — {fmt(to)}
          </span>
          <DateRangePicker from={from} to={to} onChange={setRange} />
        </div>
      </header>

      {/* ── SELECTION CARD ── */}
      <section className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 md:p-8 shadow-sm border border-slate-200">
        {/* Card header row */}
        <div className="flex items-start justify-between gap-3 mb-5 sm:mb-7">
          <div className="space-y-0.5 min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
              Select Teams
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
              Add 2–3 teams to view comparative performance
            </p>
          </div>
          {selectedSlugs.length > 0 && (
            <button
              onClick={() => setSelectedSlugs([])}
              className="shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors border-b border-transparent hover:border-slate-300 pb-0.5"
            >
              Reset
            </button>
          )}
        </div>

        <TeamSelector
          allTeams={allTeams}
          selected={selectedSlugs}
          onChange={(slugs) => {
            // Guard against exceeding the 2–3 team limit defined in CANDIDATE.md.
            // TeamSelector already disables the button, but this adds a defensive
            // server-side-style check in case the component is reused elsewhere.
            if (slugs.length <= 3) setSelectedSlugs(slugs);
          }}
          loading={allTeams.length === 0}
        />

        {/* Selected team chips */}
        {selectedSlugs.length > 0 && (
          <div className="mt-5 sm:mt-7 pt-5 sm:pt-7 border-t border-slate-100">
            {/*
        320px: stack chips vertically (flex-col)
        480px+: wrap horizontally (flex-row flex-wrap)
      */}
            <div className="flex flex-col xs:flex-row xs:flex-wrap gap-2 sm:gap-3">
              {teamsWithColor.map(({ detail, color }, i) => (
                <div
                  key={detail.slug}
                  className="flex items-center gap-3 bg-white rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow min-w-0 w-full xs:w-auto"
                >
                  {/* Color bar */}
                  <div
                    className="w-1 h-7 sm:h-8 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {/* Team info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      Team 0{i + 1}
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {detail.name}
                    </p>
                  </div>
                  {/* Remove button */}
                  <button
                    onClick={() =>
                      setSelectedSlugs((prev) =>
                        prev.filter((s) => s !== detail.slug)
                      )
                    }
                    className="shrink-0 text-slate-300 hover:text-rose-500 transition-colors p-0.5"
                    aria-label={`Remove ${detail.name}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── CONTENT AREA ── */}
      <div className="min-h-[300px] sm:min-h-[400px]">
        {selectedSlugs.length < 2 ? (
          <div className="animate-in fade-in duration-700">
            <EmptyState />
          </div>
        ) : loading ? (
          <SkeletonGrid />
        ) : (
          <div className="space-y-6 sm:space-y-8 lg:space-y-10 animate-in slide-in-from-bottom-2 duration-700">
            {/* Live badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-widest w-fit border border-indigo-100">
              <Info size={11} />
              <span>Live Comparative Breakdown</span>
            </div>

            <div className="space-y-5 sm:space-y-8 lg:space-y-10">
              <CompareKpiGrid teams={teamsWithColor} />

              {/* Charts card — tighter padding on small screens */}
              <div className="bg-white p-4 sm:p-6 md:p-10 lg:p-12 rounded-2xl sm:rounded-[2rem] lg:rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
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
  );
}
