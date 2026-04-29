import { db } from "@/db";
import {
  teams,
  repositories,
  deployments,
  pullRequests,
  incidents,
} from "@/db/schema";
import type {
  TeamWithStats,
  OverviewMetrics,
  TrendPoint,
  TeamDetail,
} from "@/types";
import {
  eq,
  gte,
  ne,
  and,
  sql,
  desc,
  ilike,
  or,
  asc,
  SQL,
  lte,
  isNotNull,
  inArray,
} from "drizzle-orm";

function parseDateRange(from?: string, to?: string) {
  return {
    fromDate: from
      ? new Date(`${from}T00:00:00.000Z`)
      : new Date(Date.now() - 30 * 86400000),
    toDate: to ? new Date(`${to}T23:59:59.999Z`) : new Date(),
  };
}

/**
 * Fetches a paginated, sorted, filtered page of teams with aggregated stats.
 *
 * Performance notes:
 * - All aggregation subqueries run as CTEs in a single round-trip.
 * - sortBy is validated against an allowlist to prevent SQL injection.
 * - fromDate/toDate default to last 30 days if not provided by the caller.
 *
 * @param page       1-indexed page number
 * @param pageSize   Number of rows per page (typically PAGE_SIZE = 5)
 * @param search     Partial match against team name or department
 * @param sortBy     Column accessor key — must be in ALLOWED_SORT_COLUMNS
 * @param sortDir    "asc" | "desc"
 * @param from       ISO date string (YYYY-MM-DD) - defaults to 30 days ago if not provided
 * @param to         ISO date string (YYYY-MM-DD) - defaults to today if not provided
 * @param department Exact match on department name
 */
export async function getTeamsWithStatsPaginated({
  page,
  pageSize,
  search,
  sortBy,
  sortDir,
  from,
  to,
  department,
}: {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  from?: string;
  to?: string;
  department?: string;
}): Promise<{ data: TeamWithStats[]; totalCount: number }> {
  const { fromDate, toDate } = parseDateRange(from, to);

  /**
   * Metric semantics:
   * - repoCount: current snapshot (not date filtered)
   * - deploys7d: date-filtered deployments for selected range
   * - prsMerged7d: date-filtered merged PRs for selected range
   * - openIncidents: current unresolved incidents snapshot
   */

  const repoCountSq = db
    .select({
      teamId: repositories.teamId,
      repoCount: sql<number>`count(*)`.as("repo_count"),
    })
    .from(repositories)
    .groupBy(repositories.teamId)
    .as("repo_counts");

  const deployCountSq = db
    .select({
      teamId: repositories.teamId,
      deploys7d: sql<number>`count(*)`.as("deploy_count"),
    })
    .from(deployments)
    .innerJoin(repositories, eq(deployments.repositoryId, repositories.id))
    .where(
      and(
        gte(deployments.deployedAt, fromDate),
        lte(deployments.deployedAt, toDate)
      )
    )
    .groupBy(repositories.teamId)
    .as("deploy_counts");

  const prCountSq = db
    .select({
      teamId: repositories.teamId,
      prsMerged7d: sql<number>`count(*)`.as("pr_count"),
    })
    .from(pullRequests)
    .innerJoin(repositories, eq(pullRequests.repositoryId, repositories.id))
    .where(
      and(
        eq(pullRequests.status, "merged"),
        isNotNull(pullRequests.mergedAt),
        gte(pullRequests.mergedAt, fromDate),
        lte(pullRequests.mergedAt, toDate)
      )
    )
    .groupBy(repositories.teamId)
    .as("pr_counts");

  const incidentCountSq = db
    .select({
      teamId: incidents.teamId,
      openIncidents: sql<number>`count(*)`.as("incident_count"),
    })
    .from(incidents)
    .where(ne(incidents.status, "resolved"))
    .groupBy(incidents.teamId)
    .as("incident_counts");

  const searchFilter = search
    ? or(
        ilike(teams.name, `%${search}%`),
        ilike(teams.department, `%${search}%`)
      )
    : undefined;

  const departmentFilter = department
    ? eq(teams.department, department)
    : undefined;

  const whereClause = and(searchFilter, departmentFilter);

  const sortableColumns: Record<string, SQL> = {
    name: sql`${teams.name}`,
    department: sql`${teams.department}`,
    repoCount: sql`coalesce(${repoCountSq.repoCount}, 0)`,
    deploys7d: sql`coalesce(${deployCountSq.deploys7d}, 0)`,
    prsMerged7d: sql`coalesce(${prCountSq.prsMerged7d}, 0)`,
    openIncidents: sql`coalesce(${incidentCountSq.openIncidents}, 0)`,
  };

  const sortColumn = sortableColumns[sortBy ?? "name"] ?? sql`${teams.name}`;

  const orderExpr = sortDir === "desc" ? desc(sortColumn) : asc(sortColumn);

  const [rows, [{ count }]] = await Promise.all([
    db
      .select({
        id: teams.id,
        name: teams.name,
        slug: teams.slug,
        department: teams.department,
        repoCount: sql<number>`coalesce(${repoCountSq.repoCount}, 0)`,
        deploys7d: sql<number>`coalesce(${deployCountSq.deploys7d}, 0)`,
        prsMerged7d: sql<number>`coalesce(${prCountSq.prsMerged7d}, 0)`,
        openIncidents: sql<number>`coalesce(${incidentCountSq.openIncidents}, 0)`,
      })
      .from(teams)
      .leftJoin(repoCountSq, eq(repoCountSq.teamId, teams.id))
      .leftJoin(deployCountSq, eq(deployCountSq.teamId, teams.id))
      .leftJoin(prCountSq, eq(prCountSq.teamId, teams.id))
      .leftJoin(incidentCountSq, eq(incidentCountSq.teamId, teams.id))
      .where(whereClause)
      .orderBy(orderExpr)
      .limit(pageSize)
      .offset((page - 1) * pageSize),

    db
      .select({ count: sql<number>`count(*)` })
      .from(teams)
      .where(whereClause),
  ]);

  return {
    data: rows.map((row) => ({
      ...row,
      repoCount: Number(row.repoCount),
      deploys7d: Number(row.deploys7d),
      prsMerged7d: Number(row.prsMerged7d),
      openIncidents: Number(row.openIncidents),
    })),
    totalCount: Number(count),
  };
}

export async function getOverviewMetrics(
  severity?: string,
  from?: string,
  to?: string
): Promise<OverviewMetrics> {
  const { fromDate, toDate } = parseDateRange(from, to);

  const deployResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(deployments)
    .where(
      and(
        gte(deployments.deployedAt, fromDate),
        lte(deployments.deployedAt, toDate)
      )
    );

  const incidentBySeverityResult = await db
    .select({
      severity: incidents.severity,
      count: sql<number>`count(*)`,
    })
    .from(incidents)
    .where(
      and(
        gte(incidents.startedAt, fromDate),
        lte(incidents.startedAt, toDate),
        ...(severity ? [eq(incidents.severity, severity)] : [])
      )
    )
    .groupBy(incidents.severity);

  const leadTimeResult = await db
    .select({
      medianHours: sql<number>`COALESCE(
        percentile_cont(0.5) WITHIN GROUP (
          ORDER BY EXTRACT(EPOCH FROM (${pullRequests.mergedAt} - ${pullRequests.firstCommitAt})) / 3600
        ), 0
      )`,
    })
    .from(pullRequests)
    .where(
      and(
        isNotNull(pullRequests.mergedAt),
        isNotNull(pullRequests.firstCommitAt),
        eq(pullRequests.status, "merged"),
        gte(pullRequests.mergedAt, fromDate),
        lte(pullRequests.mergedAt, toDate)
      )
    );

  const prResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(pullRequests)
    .where(
      and(
        isNotNull(pullRequests.mergedAt),
        gte(pullRequests.mergedAt, fromDate),
        lte(pullRequests.mergedAt, toDate),
        eq(pullRequests.status, "merged")
      )
    );

  const incidentResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(incidents)
    .where(
      and(
        gte(incidents.startedAt, fromDate),
        lte(incidents.startedAt, toDate),
        ...(severity ? [eq(incidents.severity, severity)] : [])
      )
    );

  const incidentsBySeverity = Object.fromEntries(
    incidentBySeverityResult.map((r) => [r.severity, Number(r.count)])
  );

  return {
    deploymentsPerWeek: Number(deployResult[0]?.count ?? 0),
    leadTimeHours: Number(leadTimeResult[0]?.medianHours ?? 0),
    prThroughput: Number(prResult[0]?.count ?? 0),
    incidentCount: Number(incidentResult[0]?.count ?? 0),
    incidentsBySeverity,
  };
}

export async function getTrends(
  metric: string = "deployments",
  from?: string,
  to?: string,
  teamSlug?: string,
  severity?: string
): Promise<TrendPoint[]> {
  const { fromDate, toDate } = parseDateRange(from, to);
  const fromStr = fromDate.toISOString();
  const toStr = toDate.toISOString();
  let teamFilter = sql`1=1`;
  if (teamSlug) {
    const teamRow = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.slug, teamSlug))
      .limit(1);
    if (teamRow.length === 0) return [];
    const teamId = teamRow[0].id;

    if (metric === "incidents") {
      teamFilter = eq(incidents.teamId, teamId);
    } else {
      const repoIds = await db
        .select({ id: repositories.id })
        .from(repositories)
        .where(eq(repositories.teamId, teamId));
      if (repoIds.length === 0) return [];
      const ids = repoIds.map((r) => r.id);
      if (metric === "deployments") {
        teamFilter = sql`${deployments.repositoryId} IN (${sql.join(
          ids.map((id) => sql`${id}`),
          sql`, `
        )})`;
      } else {
        teamFilter = sql`${pullRequests.repositoryId} IN (${sql.join(
          ids.map((id) => sql`${id}`),
          sql`, `
        )})`;
      }
    }
  }

  if (metric === "deployments") {
    const rows = await db.execute(sql`
      SELECT date_trunc('week', deployed_at)::date AS date, count(*) AS value
      FROM deployments
      WHERE deployed_at >= ${fromStr} AND deployed_at <= ${toStr}
        AND ${teamFilter}
      GROUP BY 1 ORDER BY 1
    `);
    return (rows as unknown as { date: string; value: number }[]).map((r) => ({
      date: String(r.date),
      value: Number(r.value),
    }));
  }

  if (metric === "prs") {
    const rows = await db.execute(sql`
      SELECT date_trunc('week', merged_at)::date AS date, count(*) AS value
      FROM pull_requests
      WHERE merged_at IS NOT NULL
        AND merged_at >= ${fromStr} AND merged_at <= ${toStr}
        AND ${teamFilter}
      GROUP BY 1 ORDER BY 1
    `);
    return (rows as unknown as { date: string; value: number }[]).map((r) => ({
      date: String(r.date),
      value: Number(r.value),
    }));
  }

  if (metric === "incidents") {
    const severityFilter =
      severity && severity !== "all" ? sql`AND severity = ${severity}` : sql``;
    const rows = await db.execute(sql`
      SELECT date_trunc('week', started_at)::date AS date, severity, count(*) AS value
      FROM incidents
      WHERE started_at >= ${fromStr} AND started_at <= ${toStr}
        AND ${teamFilter}
        ${severityFilter}
      GROUP BY 1, 2 ORDER BY 1
    `);
    return (
      rows as unknown as { date: string; severity: string; value: number }[]
    ).map((r) => ({
      date: String(r.date),
      value: Number(r.value),
      severity: (r.severity as TrendPoint["severity"]) ?? undefined,
    }));
  }

  return [];
}

export async function getTeamDetail(
  slug: string,
  from?: string,
  to?: string
): Promise<TeamDetail | null> {
  const { fromDate, toDate } = parseDateRange(from, to);

  const teamRows = await db
    .select()
    .from(teams)
    .where(eq(teams.slug, slug))
    .limit(1);

  if (teamRows.length === 0) return null;
  const team = teamRows[0];

  const repos = await db
    .select()
    .from(repositories)
    .where(eq(repositories.teamId, team.id));

  const repoStats = await Promise.all(
    repos.map(async (repo) => {
      const deployCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(deployments)
        .where(
          and(
            eq(deployments.repositoryId, repo.id),
            gte(deployments.deployedAt, fromDate),
            lte(deployments.deployedAt, toDate)
          )
        );
      const prCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(pullRequests)
        .where(
          and(
            eq(pullRequests.repositoryId, repo.id),
            gte(pullRequests.mergedAt, fromDate),
            lte(pullRequests.mergedAt, toDate)
          )
        );
      return {
        id: repo.id,
        name: repo.name,
        language: repo.language,
        deploys7d: Number(deployCount[0]?.count ?? 0),
        prsMerged7d: Number(prCount[0]?.count ?? 0),
      };
    })
  );

  const recentIncidents = await db
    .select()
    .from(incidents)
    .where(
      and(
        eq(incidents.teamId, team.id),
        gte(incidents.startedAt, fromDate),
        lte(incidents.startedAt, toDate)
      )
    )
    .orderBy(desc(incidents.startedAt))
    .limit(10);

  const repoIds = repos.map((r) => r.id);

  const deployCount = repoIds.length
    ? await db
        .select({ count: sql<number>`count(*)` })
        .from(deployments)
        .where(
          and(
            sql`${deployments.repositoryId} IN (${sql.join(
              repoIds.map((id) => sql`${id}`),
              sql`, `
            )})`,
            gte(deployments.deployedAt, fromDate),
            lte(deployments.deployedAt, toDate)
          )
        )
    : [{ count: 0 }];

  const prCount = repoIds.length
    ? await db
        .select({ count: sql<number>`count(*)` })
        .from(pullRequests)
        .where(
          and(
            sql`${pullRequests.repositoryId} IN (${sql.join(
              repoIds.map((id) => sql`${id}`),
              sql`, `
            )})`,
            gte(pullRequests.mergedAt, fromDate),
            lte(pullRequests.mergedAt, toDate)
          )
        )
    : [{ count: 0 }];

  const incidentCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(incidents)
    .where(
      and(
        eq(incidents.teamId, team.id),
        gte(incidents.startedAt, fromDate),
        lte(incidents.startedAt, toDate)
      )
    );

  const leadTimeResult = repoIds.length
    ? await db
        .select({
          medianHours: sql<number>`COALESCE(
            percentile_cont(0.5) WITHIN GROUP (
              ORDER BY EXTRACT(EPOCH FROM (${pullRequests.mergedAt} - ${pullRequests.firstCommitAt})) / 3600
            ), 0
          )`,
        })
        .from(pullRequests)
        .where(
          and(
            isNotNull(pullRequests.mergedAt),
            isNotNull(pullRequests.firstCommitAt),
            eq(pullRequests.status, "merged"),
            inArray(pullRequests.repositoryId, repoIds),
            gte(pullRequests.mergedAt, fromDate),
            lte(pullRequests.mergedAt, toDate)
          )
        )
    : [{ medianHours: 0 }];

  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    department: team.department,
    repositories: repoStats,
    recentIncidents: recentIncidents.map((i) => ({
      id: i.id,
      title: i.title,
      severity: i.severity,
      startedAt: i.startedAt.toISOString(),
      resolvedAt: i.resolvedAt?.toISOString() ?? null,
      status: i.status,
    })),
    metrics: {
      deploymentsPerWeek: Number(deployCount[0]?.count ?? 0),
      leadTimeHours: Number(leadTimeResult[0]?.medianHours ?? 0),
      prThroughput: Number(prCount[0]?.count ?? 0),
      incidentCount: Number(incidentCount[0]?.count ?? 0),
    },
  };
}

/**
 * Returns a sorted list of distinct, non-null department names.
 * Used to populate the department filter dropdown without depending
 * on the current page's subset of teams.
 */
export async function getDepartments(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ department: teams.department })
    .from(teams)
    .where(isNotNull(teams.department))
    .orderBy(asc(teams.department));

  return rows.map((r) => r.department as string);
}
