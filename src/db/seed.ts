import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { teams, repositories, deployments, pullRequests, incidents } from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://devpulse:devpulse@localhost:5434/devpulse";

const client = postgres(connectionString);
const db = drizzle(client);

// --- Helpers ---

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSha(): string {
  return Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function randomDateBetween(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

// --- Data ---

const TEAMS = [
  { name: "Platform Core", slug: "platform-core", department: "Platform" },
  { name: "Auth Service", slug: "auth-service", department: "Platform" },
  { name: "Payments", slug: "payments", department: "Product" },
  { name: "Search", slug: "search", department: "Product" },
  { name: "Notifications", slug: "notifications", department: "Product" },
  { name: "Data Pipeline", slug: "data-pipeline", department: "Infrastructure" },
  { name: "Mobile API", slug: "mobile-api", department: "Product" },
  { name: "Developer Tools", slug: "developer-tools", department: "Infrastructure" },
];

const REPOS_PER_TEAM: Record<string, { name: string; language: string }[]> = {
  "platform-core": [
    { name: "core-api", language: "TypeScript" },
    { name: "core-worker", language: "Go" },
    { name: "core-infra", language: "HCL" },
  ],
  "auth-service": [
    { name: "auth-server", language: "TypeScript" },
    { name: "auth-sdk", language: "TypeScript" },
    { name: "auth-migrations", language: "SQL" },
  ],
  payments: [
    { name: "payments-api", language: "TypeScript" },
    { name: "payments-worker", language: "Go" },
    { name: "stripe-integration", language: "TypeScript" },
  ],
  search: [
    { name: "search-indexer", language: "Python" },
    { name: "search-api", language: "Go" },
    { name: "search-ui", language: "TypeScript" },
  ],
  notifications: [
    { name: "notif-service", language: "TypeScript" },
    { name: "notif-templates", language: "TypeScript" },
    { name: "email-worker", language: "Go" },
  ],
  "data-pipeline": [
    { name: "etl-jobs", language: "Python" },
    { name: "pipeline-orchestrator", language: "Python" },
    { name: "data-warehouse", language: "SQL" },
  ],
  "mobile-api": [
    { name: "mobile-gateway", language: "TypeScript" },
    { name: "mobile-push", language: "Go" },
    { name: "mobile-analytics", language: "TypeScript" },
  ],
  "developer-tools": [
    { name: "cli-tool", language: "Go" },
    { name: "dev-portal", language: "TypeScript" },
    { name: "ci-plugins", language: "TypeScript" },
  ],
};

const SEVERITIES = ["critical", "high", "medium", "low"] as const;
const DEPLOY_STATUSES = ["success", "success", "success", "success", "failed", "rolled_back"] as const;
const PR_TITLES = [
  "Fix flaky test in CI",
  "Add retry logic for external calls",
  "Update dependencies",
  "Refactor auth middleware",
  "Add pagination to list endpoint",
  "Fix memory leak in worker",
  "Improve error messages",
  "Add health check endpoint",
  "Migrate to new SDK version",
  "Update README",
  "Add rate limiting",
  "Fix timezone handling",
  "Optimize database queries",
  "Add caching layer",
  "Fix race condition",
  "Update Docker config",
  "Add integration tests",
  "Refactor config loading",
  "Improve logging",
  "Fix null pointer in handler",
];

const INCIDENT_TITLES = [
  "Elevated error rates on API",
  "Database connection pool exhausted",
  "Deployment pipeline stuck",
  "Memory usage spike",
  "Increased latency on endpoints",
  "SSL certificate expiry warning",
  "Disk space running low",
  "Failed health checks",
  "Rate limiter misconfiguration",
  "Cache invalidation issue",
];

// --- Seed ---

async function seed() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await db.delete(incidents);
  await db.delete(pullRequests);
  await db.delete(deployments);
  await db.delete(repositories);
  await db.delete(teams);

  // Insert teams
  const insertedTeams = await db
    .insert(teams)
    .values(TEAMS)
    .returning();
  console.log(`  ✓ Inserted ${insertedTeams.length} teams`);

  const teamIdMap = new Map<string, number>();
  for (const t of insertedTeams) {
    teamIdMap.set(t.slug, t.id);
  }

  // Insert repositories
  const repoValues: { name: string; teamId: number; language: string }[] = [];
  for (const t of insertedTeams) {
    const repos = REPOS_PER_TEAM[t.slug] || [];
    for (const r of repos) {
      repoValues.push({ name: r.name, teamId: t.id, language: r.language });
    }
  }
  const insertedRepos = await db
    .insert(repositories)
    .values(repoValues)
    .returning();
  console.log(`  ✓ Inserted ${insertedRepos.length} repositories`);

  const reposByTeam = new Map<number, number[]>();
  for (const r of insertedRepos) {
    const list = reposByTeam.get(r.teamId!) || [];
    list.push(r.id);
    reposByTeam.set(r.teamId!, list);
  }

  // Insert deployments (~15,000)
  const sixMonthsAgo = daysAgo(180);
  const now = new Date();
  const deployBatch: {
    repositoryId: number;
    deployedAt: Date;
    commitSha: string;
    durationMs: number;
    status: string;
  }[] = [];

  for (const repo of insertedRepos) {
    // ~625 deploys per repo over 6 months (~3.5/day)
    const count = randomInt(500, 750);
    for (let i = 0; i < count; i++) {
      const deployedAt = randomDateBetween(sixMonthsAgo, now);
      // Fewer deploys on weekends
      if (deployedAt.getDay() === 0 || deployedAt.getDay() === 6) {
        if (Math.random() > 0.3) continue;
      }
      deployBatch.push({
        repositoryId: repo.id,
        deployedAt,
        commitSha: randomSha(),
        durationMs: randomInt(30000, 600000),
        status: randomChoice([...DEPLOY_STATUSES]),
      });
    }
  }

  // Insert in chunks
  const CHUNK = 2000;
  for (let i = 0; i < deployBatch.length; i += CHUNK) {
    await db.insert(deployments).values(deployBatch.slice(i, i + CHUNK));
  }
  console.log(`  ✓ Inserted ${deployBatch.length} deployments`);

  // Insert pull requests (~9,000)
  const prBatch: {
    repositoryId: number;
    title: string;
    openedAt: Date;
    mergedAt: Date | null;
    firstCommitAt: Date;
    additions: number;
    deletions: number;
    status: string;
  }[] = [];

  for (const repo of insertedRepos) {
    const count = randomInt(300, 450);
    for (let i = 0; i < count; i++) {
      const firstCommitAt = randomDateBetween(sixMonthsAgo, now);
      const openedAt = new Date(
        firstCommitAt.getTime() + randomInt(1, 48) * 3600000
      );
      const isMerged = Math.random() > 0.15;
      const mergedAt = isMerged
        ? new Date(openedAt.getTime() + randomInt(1, 72) * 3600000)
        : null;
      prBatch.push({
        repositoryId: repo.id,
        title: randomChoice(PR_TITLES),
        openedAt,
        mergedAt,
        firstCommitAt,
        additions: randomInt(1, 500),
        deletions: randomInt(0, 200),
        status: isMerged ? "merged" : randomChoice(["open", "closed"]),
      });
    }
  }

  for (let i = 0; i < prBatch.length; i += CHUNK) {
    await db.insert(pullRequests).values(prBatch.slice(i, i + CHUNK));
  }
  console.log(`  ✓ Inserted ${prBatch.length} pull requests`);

  // Insert incidents (~600)
  const incidentBatch: {
    teamId: number;
    title: string;
    severity: string;
    startedAt: Date;
    resolvedAt: Date | null;
    status: string;
  }[] = [];

  for (const t of insertedTeams) {
    // Platform Core and Payments get more incidents
    const isHighIncident =
      t.slug === "platform-core" || t.slug === "payments";
    const count = isHighIncident ? randomInt(100, 120) : randomInt(50, 70);
    for (let i = 0; i < count; i++) {
      const startedAt = randomDateBetween(sixMonthsAgo, now);
      const isResolved = Math.random() > 0.08;
      const resolvedAt = isResolved
        ? new Date(startedAt.getTime() + randomInt(15, 4800) * 60000)
        : null;

      // Higher severity teams get more critical/high incidents
      let severity: string;
      if (isHighIncident) {
        severity = randomChoice(["critical", "critical", "high", "high", "medium", "low"]);
      } else {
        severity = randomChoice(["critical", "high", "medium", "medium", "low", "low"]);
      }

      incidentBatch.push({
        teamId: t.id,
        title: randomChoice(INCIDENT_TITLES),
        severity,
        startedAt,
        resolvedAt,
        status: isResolved ? "resolved" : randomChoice(["ongoing", "investigating"]),
      });
    }
  }

  await db.insert(incidents).values(incidentBatch);
  console.log(`  ✓ Inserted ${incidentBatch.length} incidents`);

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
