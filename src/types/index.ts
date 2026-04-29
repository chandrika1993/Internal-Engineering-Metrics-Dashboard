import { Severity } from "@/lib/severity";
import { Activity, AlertCircle, GitMerge } from "lucide-react";

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
  severity?: Severity;
}

export interface TrendSeries {
  metric: string;
  data: TrendPoint[];
}

export interface Incident {
  id: number;
  title: string | null;
  severity: Severity;
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
  id: string; // column accessor key
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
  mergedPullRequestsTotal?: number;
  recentIncidents: Incident[];
  recentIncidentsTotal?: number;
  activeIncidentsTotal?: number;
}

export const RANGE_LABELS = {
  "7d": "Last 7 days",
  "14d": "Last 14 days",
  monthly: "Last month",
  quarterly: "Last 3 months",
  yearly: "Last year",
} as const;

export type DeploymentRange = keyof typeof RANGE_LABELS;

export const TABS = [
  { id: "velocity" as const, label: "Velocity", icon: Activity },
  { id: "prs" as const, label: "Pull Requests", icon: GitMerge },
  { id: "incidents" as const, label: "Incidents", icon: AlertCircle },
];
export type TabId = (typeof TABS)[number]["id"];

export const TEAM_COLORS = ["#4F46E5", "#b0057a", "#14B8A6"] as const;
export const TEAM_COLORS_LIGHT = ["#EEF2FF", "#faf0ff", "#F8FAFC"] as const;
export const TEAM_COLORS_BORDER = ["#C7D2FE", "#e0a8df", "#A7F3D0"] as const;
