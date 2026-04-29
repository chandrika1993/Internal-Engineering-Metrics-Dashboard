import { db } from "@/db";
import {
  deployments,
  incidents,
  pullRequests,
  repositories,
  teams,
} from "@/db/schema";
import { eq, and, desc, isNotNull, gte, sql, ne } from "drizzle-orm";

export async function getRepoBySlugAndName(teamSlug: string, repoName: string) {
  const result = await db
    .select({
      id: repositories.id,
      name: repositories.name,
      language: repositories.language,
      teamId: repositories.teamId,
      teamName: teams.name,
      teamSlug: teams.slug,
    })
    .from(repositories)
    .innerJoin(teams, eq(repositories.teamId, teams.id))
    .where(and(eq(teams.slug, teamSlug), eq(repositories.name, repoName)))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Returns ALL deployments in range. Used both for chart bucketing
 * and for deploys7d calculation, so we don't paginate this one.
 */
export async function getRepoDeploymentHistory(repoId: number, cutoff: Date) {
  return await db
    .select({
      id: deployments.id,
      repositoryId: deployments.repositoryId,
      deployedAt: deployments.deployedAt,
      commitSha: deployments.commitSha,
      durationMs: deployments.durationMs,
      status: deployments.status,
    })
    .from(deployments)
    .where(
      and(
        eq(deployments.repositoryId, repoId),
        gte(deployments.deployedAt, cutoff)
      )
    )
    .orderBy(desc(deployments.deployedAt));
}

/**
 * Paginated merged PRs in range, plus total count for pagination UI.
 * Both queries run in parallel.
 */
export async function getRepoMergedPRsPaginated(
  repoId: number,
  cutoff: Date,
  page: number,
  pageSize: number
) {
  const offset = (page - 1) * pageSize;

  const whereClause = and(
    eq(pullRequests.repositoryId, repoId),
    isNotNull(pullRequests.mergedAt),
    gte(pullRequests.mergedAt, cutoff)
  );

  const [rows, [{ count }]] = await Promise.all([
    db
      .select({
        id: pullRequests.id,
        title: pullRequests.title,
        mergedAt: pullRequests.mergedAt,
        additions: pullRequests.additions,
        deletions: pullRequests.deletions,
      })
      .from(pullRequests)
      .where(whereClause)
      .orderBy(desc(pullRequests.mergedAt))
      .limit(pageSize)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(pullRequests)
      .where(whereClause),
  ]);

  return { rows, total: Number(count) };
}

/**
 * For 7d deploy/PR cards we still need an unpaginated count of recent merges.
 * Cheap because it's bounded by the 7d window.
 */
export async function getRepoMergedPRs(repoId: number, cutoff: Date) {
  return await db
    .select({
      id: pullRequests.id,
      mergedAt: pullRequests.mergedAt,
    })
    .from(pullRequests)
    .where(
      and(
        eq(pullRequests.repositoryId, repoId),
        isNotNull(pullRequests.mergedAt),
        gte(pullRequests.mergedAt, cutoff)
      )
    );
}

/**
 * Paginated team-level incidents in range, plus total count and an
 * accurate active-count that doesn't depend on the current page.
 */
export async function getRepoIncidentsPaginated(
  repoId: number,
  cutoff: Date,
  page: number,
  pageSize: number
) {
  const repo = await db
    .select({ teamId: repositories.teamId })
    .from(repositories)
    .where(eq(repositories.id, repoId))
    .limit(1);

  const teamId = repo[0]?.teamId;
  if (!teamId) {
    return { rows: [], total: 0, activeTotal: 0 };
  }

  const offset = (page - 1) * pageSize;

  const whereClause = and(
    eq(incidents.teamId, teamId),
    gte(incidents.startedAt, cutoff)
  );

  const [rows, [{ count }], [{ activeCount }]] = await Promise.all([
    db
      .select({
        id: incidents.id,
        title: incidents.title,
        severity: incidents.severity,
        startedAt: incidents.startedAt,
        resolvedAt: incidents.resolvedAt,
        status: incidents.status,
      })
      .from(incidents)
      .where(whereClause)
      .orderBy(desc(incidents.startedAt))
      .limit(pageSize)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(incidents)
      .where(whereClause),

    db
      .select({ activeCount: sql<number>`count(*)` })
      .from(incidents)
      .where(and(whereClause, ne(incidents.status, "resolved"))),
  ]);

  return {
    rows,
    total: Number(count),
    activeTotal: Number(activeCount),
  };
}