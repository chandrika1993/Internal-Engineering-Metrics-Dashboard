// overview
import { NextRequest, NextResponse } from "next/server";
import { getOverviewMetrics } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const severity = searchParams.get("severity") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const metrics = await getOverviewMetrics(severity, from, to);
  console.log('.. metrics :: ', metrics);
  return NextResponse.json(metrics);
}
