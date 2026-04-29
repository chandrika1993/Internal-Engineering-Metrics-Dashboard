// src/hooks/useDateRange.ts
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export interface DateRange {
  from: string;
  to: string;
}

/**
 * Manages date range state via URL search params so pages are shareable.
 * Falls back to last 30 days if no params are present in the URL.
 *
 * Example shareable URL: /dashboard?from=2025-01-01&to=2025-04-28
 */
function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

function defaultTo(): string {
  return new Date().toISOString().split("T")[0];
}

export function useDateRange() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read from URL, fall back to defaults if absent
  const from = searchParams.get("from") ?? defaultFrom();
  const to = searchParams.get("to") ?? defaultTo();

  const setRange = useCallback(
    ({ from: newFrom, to: newTo }: DateRange) => {
      // Preserve all existing params (e.g. other filters) when updating range
      const params = new URLSearchParams(searchParams.toString());
      params.set("from", newFrom);
      params.set("to", newTo);
      // replaceState avoids polluting browser history on every date change
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return { from, to, setRange };
}