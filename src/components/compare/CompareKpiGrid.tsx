import type { TeamDetail } from "@/types";
import { formatHours, formatNumber } from "@/lib/utils";

interface TeamWithColor {
  detail: TeamDetail;
  color: string;
  lightColor: string;
}

function KpiCard({
  label,
  teams,
  getValue,
  format = "number",
  higherIsBetter = true,
}: {
  label: string;
  teams: TeamWithColor[];
  getValue: (d: TeamDetail) => number;
  format?: "number" | "hours";
  higherIsBetter?: boolean;
}) {
  const fmt = (v: number) =>
    format === "hours" ? formatHours(v) : formatNumber(v);
  const values = teams.map((t) => getValue(t.detail));
  const best = higherIsBetter ? Math.max(...values) : Math.min(...values);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <div className="flex flex-col gap-3">
        {teams.map(({ detail, color, lightColor }) => {
          const val = getValue(detail);
          const isBest = val === best && teams.length > 1;
          return (
            <div key={detail.slug} className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 truncate">
                    {detail.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isBest && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: lightColor, color }}
                      >
                        BEST
                      </span>
                    )}
                    <span
                      className="text-base font-bold tabular-nums"
                      style={{ color }}
                    >
                      {fmt(val)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${best > 0 ? (val / best) * 100 : 0}%`,
                      backgroundColor: color,
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CompareKpiGrid({ teams }: { teams: TeamWithColor[] }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Deployments" teams={teams}
        getValue={(d) => d.metrics.deploymentsPerWeek} higherIsBetter />
      <KpiCard label="Lead Time" teams={teams}
        getValue={(d) => d.metrics.leadTimeHours} format="hours" higherIsBetter={false} />
      <KpiCard label="PRs Merged" teams={teams}
        getValue={(d) => d.metrics.prThroughput} higherIsBetter />
      <KpiCard label="Incidents" teams={teams}
        getValue={(d) => d.metrics.incidentCount} higherIsBetter={false} />
    </section>
  );
}