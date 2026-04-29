"use client";

import { useEffect, useState } from "react";
import { useDateRange } from "@/hooks/useDateRange";
import DateRangePicker from "@/components/DateRangePicker";
import {
  TEAM_COLORS,
  TEAM_COLORS_LIGHT,
  type TeamDetail,
  type TrendPoint,
} from "@/types";
import TeamSelector from "@/components/compare/TeamSelector";
import CompareKpiGrid from "@/components/compare/CompareKpiGrid";
import { EmptyState, SkeletonGrid } from "@/components/compare/CompareStates";
import { Calendar, Layers } from "lucide-react";
import CompareCharts from "@/components/compare/CompareCharts";

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
  const [error, setError] = useState<string | null>(null); // ✅ FIX

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  useEffect(() => {
    fetch(`/api/teams?page=1&pageSize=100&search=&from=${from}&to=${to}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Teams list fetch failed [${r.status}]`);
        return r.json();
      })
      .then((d) =>
        setAllTeams(
          (d.data ?? []).map((t: { slug: string; name: string }) => ({
            slug: t.slug,
            name: t.name,
          }))
        )
      )
      .catch((err) => console.error(err));
  }, [from, to]);

  useEffect(() => {
    if (selectedSlugs.length === 0) {
      setTeamDetails([]);
      setDeployTrends({});
      setIncidentTrends({});
      setError(null);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    async function fetchJSON<T>(url: string): Promise<T> {
      const res = await fetch(url, { signal });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`[${res.status}] ${url}\n${text.slice(0, 200)}`);
      }
      return res.json();
    }

    setLoading(true);
    setError(null);

    Promise.all(
      selectedSlugs.map(async (slug) => {
        const [detail, deploys, incidents] = await Promise.all([
          fetchJSON<TeamDetail>(`/api/teams/${slug}?from=${from}&to=${to}`),
          fetchJSON<TrendPoint[]>(
            `/api/metrics/trends?metric=deployments&from=${from}&to=${to}&team=${slug}`
          ),
          fetchJSON<TrendPoint[]>(
            `/api/metrics/trends?metric=incidents&from=${from}&to=${to}&team=${slug}`
          ),
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
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError("Failed to load data for one or more teams.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [selectedSlugs, from, to]);

  const teamsWithColor = teamDetails.map((d, i) => ({
    detail: d,
    color: TEAM_COLORS[i],
    lightColor: TEAM_COLORS_LIGHT[i],
  }));

  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1 sm:space-y-2 min-w-0">
          <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
            <Layers size={12} className="shrink-0" />
            <span>Cross-Team Analysis</span>
          </div>
          <h1 className="text-[22px] xs:text-[26px] sm:text-[30px] lg:text-[36px] font-bold tracking-tight text-slate-900 leading-tight truncate">
            Comparison Hub
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-white pl-3 pr-2 py-2 rounded-xl border border-slate-200 shadow-sm self-start lg:self-end shrink-0">
          <Calendar size={14} className="text-slate-400 shrink-0" />
          <span className="hidden xs:block text-xs sm:text-sm font-semibold text-slate-700 tabular-nums pr-2 border-r border-slate-100 whitespace-nowrap">
            {fmt(from)} — {fmt(to)}
          </span>
          <DateRangePicker from={from} to={to} onChange={setRange} />
        </div>
      </header>

      <section className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 md:p-8 shadow-sm border border-slate-200">
        <div className="flex items-start justify-between gap-3 mb-5 sm:mb-7">
          <div className="space-y-0.5 min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
              Select Teams
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
              Add 2–3 teams to view comparative performance
            </p>
          </div>
        </div>

        <TeamSelector
          allTeams={allTeams}
          selected={selectedSlugs}
          onChange={(slugs) => slugs.length <= 3 && setSelectedSlugs(slugs)}
          loading={allTeams.length === 0}
        />
      </section>

      {selectedSlugs.length < 2 ? (
        <EmptyState />
      ) : loading ? (
        <SkeletonGrid />
      ) : error ? (
        <div>{error}</div>
      ) : (
        <>
          <CompareKpiGrid teams={teamsWithColor} />

          <CompareCharts
            teams={teamsWithColor.map((t) => ({
              detail: t.detail,
              color: t.color,
            }))}
            deployTrends={deployTrends}
            incidentTrends={incidentTrends}
          />
        </>
      )}
    </div>
  );
}
