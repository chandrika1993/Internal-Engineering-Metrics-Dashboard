import { getTeamsWithStatsPaginated } from "@/lib/queries";
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

  const result = await getTeamsWithStatsPaginated({ page, pageSize, search, sortBy, sortDir, from, to });
  return NextResponse.json(result);
}