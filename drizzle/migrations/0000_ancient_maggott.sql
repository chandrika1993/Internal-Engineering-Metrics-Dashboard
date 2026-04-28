CREATE TABLE "deployments" (
	"id" serial PRIMARY KEY NOT NULL,
	"repository_id" integer,
	"deployed_at" timestamp with time zone NOT NULL,
	"commit_sha" varchar(40) NOT NULL,
	"duration_ms" integer,
	"status" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer,
	"title" varchar(300),
	"severity" varchar(10) NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone,
	"status" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "pull_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"repository_id" integer,
	"title" varchar(300),
	"opened_at" timestamp with time zone NOT NULL,
	"merged_at" timestamp with time zone,
	"first_commit_at" timestamp with time zone,
	"additions" integer DEFAULT 0,
	"deletions" integer DEFAULT 0,
	"status" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"team_id" integer,
	"language" varchar(30),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"department" varchar(50),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "teams_name_unique" UNIQUE("name"),
	CONSTRAINT "teams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX idx_deployments_repo_deployed ON deployments(repository_id, deployed_at);--> statement-breakpoint
CREATE INDEX idx_pull_requests_repo_merged ON pull_requests(repository_id, merged_at);--> statement-breakpoint
CREATE INDEX idx_incidents_team_started ON incidents(team_id, started_at);--> statement-breakpoint
CREATE INDEX idx_incidents_severity ON incidents(severity);