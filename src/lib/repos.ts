import { db } from "@/db";
import { deployments, incidents, pullRequests, repositories, teams } from "@/db/schema";
import { eq, and, desc, isNotNull } from "drizzle-orm";

export async function getRepoBySlugAndName(
  teamSlug: string,
  repoName: string
) {
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
    .where(
      and(
        eq(teams.slug, teamSlug),
        eq(repositories.name, repoName)
      )
    )
    .limit(1);

  return result[0] ?? null;
}

/**
 * Deployment history for a repository
 */
export async function getRepoDeploymentHistory(repoId: number) {
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
    .where(eq(deployments.repositoryId, repoId))
    .orderBy(desc(deployments.deployedAt));
}

/**
 * Merged PRs for a repository
 */
export async function getRepoMergedPRs(repoId: number) {
  return await db
    .select({
      id: pullRequests.id,
      title: pullRequests.title,
      mergedAt: pullRequests.mergedAt,
      additions: pullRequests.additions,
      deletions: pullRequests.deletions,
    })
    .from(pullRequests)
    .where(
      and(
        eq(pullRequests.repositoryId, repoId),
        isNotNull(pullRequests.mergedAt) // <-- Filter out the nulls here
      )
    )
    .orderBy(desc(pullRequests.mergedAt));
}

/**
 * Incidents related to the repo's owning team
 */
export async function getRepoIncidents(repoId: number) {
  const repo = await db
    .select({
      teamId: repositories.teamId,
    })
    .from(repositories)
    .where(eq(repositories.id, repoId))
    .limit(1);

  const teamId = repo[0]?.teamId;

  if (!teamId) return [];

  return await db
    .select({
      id: incidents.id,
      title: incidents.title,
      severity: incidents.severity,
      startedAt: incidents.startedAt,
      resolvedAt: incidents.resolvedAt,
      status: incidents.status,
    })
    .from(incidents)
    .where(eq(incidents.teamId, teamId))
    .orderBy(desc(incidents.startedAt));
}