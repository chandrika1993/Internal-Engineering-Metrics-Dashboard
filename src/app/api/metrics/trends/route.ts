import { NextRequest, NextResponse } from "next/server";
import { getTrends } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const metric = searchParams.get("metric") ?? "deployments";
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const teamSlug = searchParams.get("team") ?? undefined;
  const severity = searchParams.get("severity") ?? undefined;
  const trends = await getTrends(metric, from, to, teamSlug, severity);
  return NextResponse.json(trends);
}
