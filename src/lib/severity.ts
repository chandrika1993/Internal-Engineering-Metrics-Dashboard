export type SeverityFilter = "all" | "critical" | "high" | "medium" | "low";

export const SEVERITY_CONFIG: Record<
  SeverityFilter,
  {
    label: string;
    color: string;
    activeClass: string;
    borderClass: string;
  }
> = {
  all:      { label: "All",      color: "#6366f1", activeClass: "bg-indigo-500 text-white",  borderClass: "border-l-4 border-l-indigo-500" },
  critical: { label: "Critical", color: "#dc2626", activeClass: "bg-red-600 text-white",     borderClass: "border-l-4 border-l-red-600"    },
  high:     { label: "High",     color: "#ea580c", activeClass: "bg-orange-600 text-white",  borderClass: "border-l-4 border-l-orange-600" },
  medium:   { label: "Medium",   color: "#d97706", activeClass: "bg-amber-600 text-white",   borderClass: "border-l-4 border-l-amber-600"  },
  low:      { label: "Low",      color: "#16a34a", activeClass: "bg-green-600 text-white",   borderClass: "border-l-4 border-l-green-600"  },
};
