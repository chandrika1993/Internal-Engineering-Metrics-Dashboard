import type { TrendPoint } from "@/types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg text-sm">
      <p className="text-xs text-gray-400 mb-2">
        {new Date(label).toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "numeric",
        })}
      </p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600">{p.name}</span>
          <span className="font-semibold ml-auto pl-4" style={{ color: p.color }}>
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function CompareChart({
  label,
  teamTrends,
}: {
  label: string;
  teamTrends: { name: string; color: string; data: TrendPoint[] }[];
}) {
  const dateSet = new Set<string>();
  teamTrends.forEach(({ data }) => data.forEach((p) => dateSet.add(p.date)));
  const dates = Array.from(dateSet).sort();

  const merged = dates.map((date) => {
    const row: Record<string, number | string> = { date };
    teamTrends.forEach(({ name, data }) => {
      row[name] = data.find((p) => p.date === date)?.value ?? 0;
    });
    return row;
  });

  return (
    <div className="rounded-2xl border-gray-100 bg-white">
      <div className="p-4 sm:p-6">
        <p className="text-sm font-semibold text-gray-800 mb-1">{label}</p>
        <p className="text-xs text-gray-400">Weekly aggregated</p>
      </div>
      <div className="h-[280px] lg:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={merged} margin={{ top: 10, right: 25, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                tickFormatter={(d) =>
                  new Date(d).toLocaleDateString("en-GB", { month: "short", day: "numeric" })
                }
            />
            <YAxis 
                tick={{ fontSize: 10, fill: "#9ca3af" }} 
                tickLine={false} 
                axisLine={false} 
                width={35}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend 
                iconType="circle" 
                iconSize={8} 
                wrapperStyle={{ fontSize: 11, paddingTop: 30 }}
            />
            {teamTrends.map(({ name, color }) => (
                <Line key={name} type="monotone" dataKey={name} stroke={color}
                strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            ))}
            </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function CompareCharts({
  teams,
  deployTrends,
  incidentTrends,
}: {
  teams: { detail: { slug: string; name: string }; color: string }[];
  deployTrends: Record<string, TrendPoint[]>;
  incidentTrends: Record<string, TrendPoint[]>;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
      <CompareChart
        label="Deployment Frequency"
        teamTrends={teams.map(({ detail, color }) => ({
          name: detail.name, color, data: deployTrends[detail.slug] ?? [],
        }))}
      />
      <CompareChart
        label="Incidents"
        teamTrends={teams.map(({ detail, color }) => ({
          name: detail.name, color, data: incidentTrends[detail.slug] ?? [],
        }))}
      />
    </section>
  );
}
