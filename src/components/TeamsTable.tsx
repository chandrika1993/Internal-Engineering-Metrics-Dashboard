"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import type { TeamWithStats } from "@/types";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

const columnHelper = createColumnHelper<TeamWithStats>();

const columns = [
  columnHelper.accessor("name", {
    header: "Team",
    cell: (info) => (
      <a
        href={`/teams/${info.row.original.slug}`}
        className="text-indigo-600 hover:underline font-medium"
      >
        {info.getValue()}
      </a>
    ),
  }),
  columnHelper.accessor("department", {
    header: "Department",
  }),
  columnHelper.accessor("repoCount", {
    header: "Repos",
  }),
  columnHelper.accessor("deploys7d", {
    header: "Deploys (7d)",
  }),
  columnHelper.accessor("prsMerged7d", {
    header: "PRs Merged (7d)",
  }),
  columnHelper.accessor("openIncidents", {
    header: "Open Incidents",
    cell: (info) => {
      const val = info.getValue();
      return (
        <span className={val > 5 ? "text-red-600 font-semibold" : ""}>
          {val}
        </span>
      );
    },
  }),
];

const mobileLabels: Record<string, string> = {
  name: "Team",
  department: "Department",
  repoCount: "Repos",
  deploys7d: "Deploys (7d)",
  prsMerged7d: "PRs Merged (7d)",
  openIncidents: "Open Incidents",
};

export interface TeamsTableProps {
  data: TeamWithStats[];
  searchQuery: string;
  loading?: boolean;
  error?: string | null;
  sorting: SortingState;
  onSortChange: (s: SortingState) => void;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 w-full bg-gray-200 animate-pulse rounded" />
        </td>
      ))}
    </tr>
  );
}

export default function TeamsTable({
  data,
  loading,
  error,
  sorting,
  onSortChange,
  page,
  totalPages,
  onPageChange,
}: TeamsTableProps) {

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      onSortChange(next);
    },
    manualSorting: true,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;

  if (error) {
    return (
      <div role="status" aria-live="polite" className="flex justify-center items-center py-10 text-sm text-red-500 animate-in fade-in">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-in fade-in">
      {/* ── Desktop ── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortEntry = sorting.find((s) => s.id === header.column.id);
                  const sortDirection = sortEntry ? (sortEntry.desc ? 'descending' : 'ascending') : 'none';
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={sortDirection}
                      aria-label={`Sort by ${flexRender(header.column.columnDef.header, header.getContext())} ${
                        sortEntry ? (sortEntry.desc ? "descending" : "ascending") : ""
                      }`}
                      className={`px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer select-none transition-colors group
                      ${
                        sortEntry
                          ? "text-indigo-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <span
                          className={`transition-opacity ${
                            sortEntry
                              ? "opacity-100 text-indigo-500"
                              : "opacity-0 group-hover:opacity-40"
                          }`}
                        >
                          {sortEntry ? (
                            sortEntry.desc ? (
                              <ArrowDown size={14} />
                            ) : (
                              <ArrowUp size={14} />
                            )
                          ) : (
                            <ArrowUpDown size={14} />
                          )}
                        </span>
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-gray-200" role="status" aria-live="polite">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-10 text-sm text-gray-400"
                >
                  No teams found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-sm text-gray-700"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile ── */}
      <ul className="sm:hidden divide-y divide-gray-200">
        {loading ? (
          <div role="status" aria-live="polite">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="px-3 py-4">
                <div className="h-3 w-1/2 bg-gray-200 animate-pulse mb-2 rounded" />
                <div className="h-3 w-1/3 bg-gray-200 animate-pulse rounded" />
              </li>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-gray-400">
            No teams found.
          </li>
        ) : (
          rows.map((row) => {
            const cells = row.getVisibleCells();
            const nameCell = cells.find((c) => c.column.id === "name");
            const deptCell = cells.find((c) => c.column.id === "department");
            const statCells = cells.filter(
              (c) => c.column.id !== "name" && c.column.id !== "department"
            );
            return (
              <li key={row.id} className="px-3 py-3 hover:bg-gray-50">
                {nameCell && (
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {flexRender(
                      nameCell.column.columnDef.cell,
                      nameCell.getContext()
                    )}
                  </div>
                )}
                {deptCell && (
                  <div className="text-xs text-gray-400 mb-2">
                    {flexRender(
                      deptCell.column.columnDef.cell,
                      deptCell.getContext()
                    )}
                  </div>
                )}
                <dl className="grid grid-cols-2 gap-2">
                  {statCells.map((cell) => (
                    <div
                      key={cell.id}
                      className="bg-gray-50 rounded px-2 py-1.5"
                    >
                      <dt className="text-[10px] text-gray-400 uppercase">
                        {mobileLabels[cell.column.id] ?? cell.column.id}
                      </dt>
                      <dd className="text-sm font-medium">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })
        )}
      </ul>

      {/* ── Pagination ── */}
      <nav aria-label="Pagination" className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
        <span>
          Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            aria-label="Go to previous page"
            aria-disabled={page <= 1 || loading}
            className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors"
          >
            ←
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            aria-label="Go to next page"
            aria-disabled={page >= totalPages || loading}
            className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors"
          >
            →
          </button>
        </div>
      </nav>
    </div>
  );
}
