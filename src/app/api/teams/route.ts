// src/app/api/teams/route.ts
import { getTeamsWithStatsPaginated, getDepartments } from "@/lib/queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page     = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.max(1, Number(searchParams.get("pageSize") ?? 5));
  const search   = searchParams.get("search") ?? "";
  const sortBy   = searchParams.get("sortBy") ?? "name";
  const sortDir  = searchParams.get("sortDir") === "desc" ? "desc" : "asc";
  const from     = searchParams.get("from") ?? undefined;
  const to       = searchParams.get("to") ?? undefined;
  const department = searchParams.get("department") ?? undefined;

  // Run paginated query and department lookup in parallel
  const [result, departments] = await Promise.all([
    getTeamsWithStatsPaginated({ page, pageSize, search, sortBy, sortDir, from, to, department }),
    getDepartments(), // lightweight distinct query — add to queries.ts
  ]);

  return NextResponse.json({ ...result, departments });
}