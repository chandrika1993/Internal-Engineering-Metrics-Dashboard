import {
  getRepoBySlugAndName,
  getRepoDeploymentHistory,
  getRepoIncidents,
  getRepoMergedPRs,
} from "@/lib/repos";
import { calcDeploys7d, calcPrsMerged7d } from "@/lib/repoMetrics";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; repoName: string }> }
) {
  const { slug, repoName } = await params;
  const decodedRepoName = decodeURIComponent(repoName);
  const decodedTeamSlug = decodeURIComponent(slug);

  const repo = await getRepoBySlugAndName(decodedTeamSlug, decodedRepoName);

  if (!repo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [rawDeployments, rawPRs, recentIncidents] = await Promise.all([
    getRepoDeploymentHistory(repo.id),
    getRepoMergedPRs(repo.id),
    getRepoIncidents(repo.id),
  ]);

  // --- FIX FOR DEPLOYMENT CHART ---
  // 1. Create a map of the last 14 days initialized to 0
  const historyMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    historyMap.set(dateStr, 0);
  }

  // 2. Aggregate raw deployments into the daily buckets
  rawDeployments.forEach((dep) => {
    const dateStr = new Date(dep.deployedAt).toISOString().split('T')[0];
    if (historyMap.has(dateStr)) {
      historyMap.set(dateStr, (historyMap.get(dateStr) || 0) + 1);
    }
  });

  // 3. Convert map back to the TrendPoint format the chart expects
  const deploymentHistory = Array.from(historyMap).map(([date, value]) => ({
    date,
    value,
  }));

  const mergedPullRequests = rawPRs.map(pr => ({
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