"use client";

import { useState } from "react";

export interface DateRange {
  from: string; // ISO date string YYYY-MM-DD
  to: string;
}

function defaultRange(): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export function useDateRange() {
  const [{ from, to }, setRange] = useState(defaultRange);
  return { from, to, setRange };
}
