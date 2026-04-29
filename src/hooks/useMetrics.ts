"use client";

import { useState, useEffect } from "react";
import type { OverviewMetrics } from "@/types";

export function useMetrics(from: string, to: string, severity: string) {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadMetrics() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ from, to });
        if (severity !== "all") {
          params.append("severity", severity);
        }
        const res = await fetch(`/api/metrics/overview?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch metrics");
        setMetrics(await res.json());
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
    return () => controller.abort();  // Cleanup: abort any in-flight request when deps change or component unmounts
  }, [from, to, severity]);

  return { metrics, loading, error };
}
