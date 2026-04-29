"use client";

import { useState, useEffect } from "react";
import type { TrendPoint } from "@/types";

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
        if (severity && severity !== "all") {
          params.append("severity", severity);
        }
        const res = await fetch(`/api/metrics/trends?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch trends");
        setTrends(await res.json());
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    }

    loadTrends();
    return () => controller.abort(); // Cleanup: abort any in-flight request when deps change or component unmounts
  }, [metric, from, to, severity]);

  return { trends, loading, error };
}
