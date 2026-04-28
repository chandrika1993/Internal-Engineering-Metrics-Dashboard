"use client";

import { DateRange } from "@/hooks/useDateRange";

interface Props {
  from: string;
  to: string;
  onChange: (range: DateRange) => void;
}

export default function DateRangePicker({ from, to, onChange }: Props) {
  const today = new Date().toISOString().split("T")[0];
  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="text-gray-500">From</label>
      <input
        type="date"
        value={from}
        max={to}
        onChange={(e) => onChange({ from: e.target.value, to })}
        className="rounded border border-gray-200 px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <label className="text-gray-500">To</label>
      <input
        type="date"
        value={to}
        min={from}
        max={today}
        onChange={(e) => onChange({ from, to: e.target.value })}
        className="rounded border border-gray-200 px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
    </div>
  );
}
