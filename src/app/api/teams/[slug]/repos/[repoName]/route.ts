import {
  getRepoBySlugAndName,
  getRepoDeploymentHistory,
  getRepoIncidentsPaginated,
  getRepoMergedPRs,
  getRepoMergedPRsPaginated,
} from "@/lib/repos";
import { calcDeploys7d, calcPrsMerged7d } from "@/lib/repoMetrics";
import { NextResponse } from "next/server";

import type { DeploymentRange } from "@/types";

const VALID_RANGES: readonly DeploymentRange[] = [
  "7d",
  "14d",
  "monthly",
  "quarterly",
  "yearly",
];

const PAGE_SIZE = 10;

function isValidRange(value: string): value is DeploymentRange {
  return (VALID_RANGES as readonly string[]).includes(value);
}

function getCutoff(range: DeploymentRange): Date {
  const cutoff = new Date();
  cutoff.setUTCHours(0, 0, 0, 0);

  switch (range) {
    case "7d":
      cutoff.setUTCDate(cutoff.getUTCDate() - 7);
      break;
    case "14d":
      cutoff.setUTCDate(cutoff.getUTCDate() - 14);
      break;
    case "monthly":
      cutoff.setUTCMonth(cutoff.getUTCMonth() - 1);
      break;
    case "quarterly":
      cutoff.setUTCMonth(cutoff.getUTCMonth() - 3);
      break;
    case "yearly":
      cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
      break;
  }

  return cutoff;
}

function rangeDays(range: DeploymentRange): number {
  switch (range) {
    case "7d":
      return 7;
    case "14d":
      return 14;
    case "monthly":
      return 30;
    case "quarterly":
      return 90;
    case "yearly":
      return 365;
  }
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

  const rawRange = searchParams.get("range") ?? "14d";
  const range: DeploymentRange = isValidRange(rawRange) ? rawRange : "14d";

  const prPage = Math.max(1, Number(searchParams.get("prPage") ?? 1) || 1);
  const incidentPage = Math.max(
    1,
    Number(searchParams.get("incidentPage") ?? 1) || 1
  );

  const cutoff = getCutoff(range);
  const sevenDayCutoff = new Date();
  sevenDayCutoff.setUTCDate(sevenDayCutoff.getUTCDate() - 7);

  const [
    rawDeployments,
    recentDeploysFor7d,
    recentPRsFor7d,
    pagedPRs,
    pagedIncidents,
  ] = await Promise.all([
    getRepoDeploymentHistory(repo.id, cutoff),
    getRepoDeploymentHistory(repo.id, sevenDayCutoff),
    getRepoMergedPRs(repo.id, sevenDayCutoff),
    getRepoMergedPRsPaginated(repo.id, cutoff, prPage, PAGE_SIZE),
    getRepoIncidentsPaginated(repo.id, cutoff, incidentPage, PAGE_SIZE),
  ]);

  // Bucket deployments into daily totals for the chart.
  const historyMap = new Map<string, number>();
  const days = rangeDays(range);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    historyMap.set(d.toISOString().split("T")[0], 0);
  }

  rawDeployments.forEach((dep) => {
    const dateStr = new Date(dep.deployedAt).toISOString().split("T")[0];
    if (historyMap.has(dateStr)) {
      historyMap.set(dateStr, (historyMap.get(dateStr) || 0) + 1);
    }
  });

  const deploymentHistory = Array.from(historyMap, ([date, value]) => ({
    date,
    value,
  }));

  const mergedPullRequests = pagedPRs.rows.map((pr) => ({
    ...pr,
    mergedAt: pr.mergedAt ? new Date(pr.mergedAt).toISOString() : null,
  }));

  const recentIncidents = pagedIncidents.rows.map((inc) => ({
    ...inc,
    startedAt: new Date(inc.startedAt).toISOString(),
    resolvedAt: inc.resolvedAt ? new Date(inc.resolvedAt).toISOString() : null,
  }));

  return NextResponse.json({
    ...repo,
    deploys7d: calcDeploys7d(recentDeploysFor7d),
    prsMerged7d: calcPrsMerged7d(recentPRsFor7d),
    deploymentHistory,
    mergedPullRequests,
    mergedPullRequestsTotal: pagedPRs.total,
    recentIncidents,
    recentIncidentsTotal: pagedIncidents.total,
    activeIncidentsTotal: pagedIncidents.activeTotal,
  });
}