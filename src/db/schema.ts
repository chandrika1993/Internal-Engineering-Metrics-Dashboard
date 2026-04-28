import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  department: varchar("department", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  teamId: integer("team_id").references(() => teams.id),
  language: varchar("language", { length: 30 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const deployments = pgTable("deployments", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").references(() => repositories.id),
  deployedAt: timestamp("deployed_at", { withTimezone: true }).notNull(),
  commitSha: varchar("commit_sha", { length: 40 }).notNull(),
  durationMs: integer("duration_ms"),
  status: varchar("status", { length: 20 }),
});

export const pullRequests = pgTable("pull_requests", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").references(() => repositories.id),
  title: varchar("title", { length: 300 }),
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull(),
  mergedAt: timestamp("merged_at", { withTimezone: true }),
  firstCommitAt: timestamp("first_commit_at", { withTimezone: true }),
  additions: integer("additions").default(0),
  deletions: integer("deletions").default(0),
  status: varchar("status", { length: 20 }),
});

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id),
  title: varchar("title", { length: 300 }),
  severity: varchar("severity", { length: 10 }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  status: varchar("status", { length: 20 }),
});
