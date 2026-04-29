export type Severity = "critical" | "high" | "medium" | "low";
export type SeverityFilter = "all" | Severity;

export const SEVERITY_CONFIG: Record<
  SeverityFilter,
  {
    label: string;
    color: string;
    activeClass: string;
    borderClass: string;
    bgClass: string;
    textClass: string;
    ringClass: string;
  }
> = {
  all: {
    label: "All",
    color: "#6366f1",
    activeClass: "bg-indigo-500 text-white",
    borderClass: "border-l-4 border-l-indigo-500",
    bgClass: "bg-slate-100",
    textClass: "text-slate-600",
    ringClass: "ring-slate-200",
  },
  critical: {
    label: "Critical",
    color: "#e53e3e",
    activeClass: "bg-red-600 text-white",
    borderClass: "border-l-4 border-l-red-600",
    bgClass: "bg-red-100",
    textClass: "text-red-700",
    ringClass: "ring-red-200",
  },
  high: {
    label: "High",
    color: "#ed8936",
    activeClass: "bg-orange-500 text-white",
    borderClass: "border-l-4 border-l-orange-500",
    bgClass: "bg-orange-100",
    textClass: "text-orange-700",
    ringClass: "ring-orange-200",
  },
  medium: {
    label: "Medium",
    color: "#4299e1",
    activeClass: "bg-blue-500 text-white",
    borderClass: "border-l-4 border-l-blue-500",
    bgClass: "bg-blue-100",
    textClass: "text-blue-700",
    ringClass: "ring-blue-200",
  },
  low: {
    label: "Low",
    color: "#38b2ac",
    activeClass: "bg-teal-500 text-white",
    borderClass: "border-l-4 border-l-teal-500",
    bgClass: "bg-teal-100",
    textClass: "text-teal-700",
    ringClass: "ring-teal-200",
  },
};
