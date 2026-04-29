import { NextRequest, NextResponse } from "next/server";
import { getTrends } from "@/lib/queries";

const VALID_METRICS = ["deployments", "prs", "incidents"] as const;
const VALID_SEVERITIES = ["critical", "high", "medium", "low"] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawMetric = searchParams.get("metric") ?? "deployments";
  const metric = (VALID_METRICS as readonly string[]).includes(rawMetric)
    ? rawMetric
    : "deployments";

  const rawSeverity = searchParams.get("severity") ?? undefined;
  const severity =
    rawSeverity && (VALID_SEVERITIES as readonly string[]).includes(rawSeverity)
      ? rawSeverity
      : undefined;

  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const teamSlug = searchParams.get("team") ?? undefined;

  const trends = await getTrends(metric, from, to, teamSlug, severity);
  return NextResponse.json(trends);
}
