export interface Team {
  id: number;
  name: string;
  slug: string;
  department: string | null;
}

export interface TeamWithStats extends Team {
  repoCount: number;
  deploys7d: number;
  prsMerged7d: number;
  openIncidents: number;
}

export interface OverviewMetrics {
  deploymentsPerWeek: number;
  leadTimeHours: number;
  prThroughput: number;
  incidentCount: number;
  incidentsBySeverity?: Record<string, number>;
}

export interface TrendPoint {
  date: string;
  value: number;
  severity?: "critical" | "high" | "medium" | "low";
}

export interface TrendSeries {
  metric: string;
  data: TrendPoint[];
}

export interface Incident {
  id: number;
  title: string | null;
  severity: string;
  startedAt: string;
  resolvedAt: string | null;
  status: string | null;
}

export interface TeamDetail extends Team {
  repositories: {
    id: number;
    name: string;
    language: string | null;
    deploys7d: number;
    prsMerged7d: number;
  }[];
  recentIncidents: Incident[];
  metrics: OverviewMetrics;
}

// types/index.ts (additions)
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface SortParam {
  id: string;       // column accessor key
  desc: boolean;
}

export interface RepoPullRequest {
  id: number;
  title: string | null;
  mergedAt: string;
  additions: number;
  deletions: number;
}

export interface RepoDetail {
  id: number;
  name: string;
  language: string | null;
  teamId: number;
  teamName: string;
  teamSlug: string;
  deploys7d: number;
  prsMerged7d: number;
  deploymentHistory: TrendPoint[];
  mergedPullRequests: RepoPullRequest[];
  recentIncidents: Incident[];
}