"use client";

import { Search, XCircle } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="relative group w-full max-w-sm">
      {/* Search Icon (Left) */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
        <Search size={16} strokeWidth={2.5} />
      </div>

      <input
        type="text"
        placeholder="Search teams..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm placeholder:text-slate-400"
      />

      {/* Clear Icon (Right) */}
      {searchQuery && (
        <button
          onClick={() => onSearchChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
        >
          <XCircle size={18} fill="currentColor" className="text-white" />
          <XCircle size={18} className="absolute inset-0" />
        </button>
      )}
    </div>
  );
}
