'use client';

import { Search, XCircle, ChevronsUpDown } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  departments: string[];
  currentDepartment: string;
  onDepartmentChange: (value: string) => void;
}

export default function FilterBar({  searchQuery,  onSearchChange,  departments,
  currentDepartment,
  onDepartmentChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
      {/* Search Input */}
      <div className="relative group w-full">
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
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
          >
            <XCircle size={18} fill="currentColor" className="text-white" />
            <XCircle size={18} className="absolute inset-0" />
          </button>
        )}
      </div>

      {/* Department Dropdown */}
      <div className="relative group w-full sm:w-auto">
        <select
          value={currentDepartment}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="appearance-none w-full sm:w-auto pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-600 transition-colors pointer-events-none">
          <ChevronsUpDown size={16} />
        </div>
      </div>
    </div>
  );
}
