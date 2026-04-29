import {
  getRepoBySlugAndName,
  getRepoDeploymentHistory,
  getRepoIncidents,
  getRepoMergedPRs,
} from "@/lib/repos";
import { calcDeploys7d, calcPrsMerged7d } from "@/lib/repoMetrics";
import { NextResponse } from "next/server";

function getCutoff(range: string) {
  const now = new Date();
  const cutoff = new Date();

  switch (range) {
    case "7d":
      cutoff.setDate(now.getDate() - 7);
      break;
    case "14d":
      cutoff.setDate(now.getDate() - 14);
      break;
    case "monthly":
      cutoff.setMonth(now.getMonth() - 1);
      break;
    case "quarterly":
      cutoff.setMonth(now.getMonth() - 3);
      break;
    case "yearly":
      cutoff.setFullYear(now.getFullYear() - 1);
      break;
  }

  return cutoff;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string; repoName: string }> }
) {
  const { slug, repoName } = await params;
  const decodedRepoName = decodeURIComponent(repoName);
  const decodedTeamSlug = decodeURIComponent(slug);

  const repo = await getRepoBySlugAndName(decodedTeamSlug, decodedRepoName);

  if (!repo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "14d";

  const cutoff = getCutoff(range);

  const [rawDeployments, rawPRs, recentIncidents] = await Promise.all([
    getRepoDeploymentHistory(repo.id, cutoff),
    getRepoMergedPRs(repo.id, cutoff),
    getRepoIncidents(repo.id, cutoff),
  ]);

  // --- FIX FOR DEPLOYMENT CHART ---
  // 1. Create a map of the last 14 days initialized to 0
  const historyMap = new Map<string, number>();
  const rangeDays =
    range === "7d"
      ? 7
      : range === "14d"
      ? 14
      : range === "monthly"
      ? 30
      : range === "quarterly"
      ? 90
      : 365;
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    historyMap.set(dateStr, 0);
  }

  // 2. Aggregate raw deployments into the daily buckets
  rawDeployments.forEach((dep) => {
    const dateStr = new Date(dep.deployedAt).toISOString().split("T")[0];
    if (historyMap.has(dateStr)) {
      historyMap.set(dateStr, (historyMap.get(dateStr) || 0) + 1);
    }
  });

  // 3. Convert map back to the TrendPoint format the chart expects
  const deploymentHistory = Array.from(historyMap).map(([date, value]) => ({
    date,
    value,
  }));

  const mergedPullRequests = rawPRs.map((pr) => ({
    ...pr,
    mergedAt: pr.mergedAt ? new Date(pr.mergedAt).toISOString() : null,
  }));

  return NextResponse.json({
    ...repo,
    deploys7d: calcDeploys7d(rawDeployments),
    prsMerged7d: calcPrsMerged7d(rawPRs),
    deploymentHistory, // Now sending daily totals instead of hundreds of raw rows
    mergedPullRequests,
    recentIncidents,
  });
}
