"use client";

import { useState, useEffect } from "react";
import type { TrendPoint } from "@/types";
import { fetchJSON, isAbortError } from "@/lib/fetchJSON";

export function useTrends(
  metric: string,
  from: string,
  to: string,
  severity?: string
) {
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTrends() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ metric, from, to });
        if (severity && severity !== "all") params.append("severity", severity);

        const data = await fetchJSON<TrendPoint[]>(
          `/api/metrics/trends?${params.toString()}`,
          { signal: controller.signal }
        );
        setTrends(data);
      } catch (err) {
        if (isAbortError(err)) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadTrends();
    return () => controller.abort();
  }, [metric, from, to, severity]);

  return { trends, loading, error };
}