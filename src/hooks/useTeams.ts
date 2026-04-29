// src/hooks/useTeams.ts

import { useState, useEffect, useCallback } from 'react';
import { SortingState } from '@tanstack/react-table';
import type { TeamWithStats } from '@/types';
import { PAGE_SIZE } from '@/lib/utils';

/**
 * Encapsulates all teams list state: data fetching, pagination,
 * sorting, searching, and department filtering.
 *
 * Design decision: page resets to 1 on any filter change to prevent
 * the user landing on a page that no longer exists after narrowing results.
 *
 * Departments are fetched separately from the paginated results so the
 * dropdown always shows all possible values, not just the current page's subset.
 */
export function useTeams(
  debouncedValue: string,
  department: string,
  from: string,
  to: string
) {
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  /**
   * Departments are fetched from the server and should not be derived
   * from the current page's data — that gives an incomplete list when
   * only 5 teams are visible. Store them separately.
   */
  const [departments, setDepartments] = useState<string[]>([]);

  const loadTeams = useCallback(async (
    currentPage: number,
    currentSorting: SortingState,
    search: string,
    dept: string,
    from: string,
    to: string
  ) => {
    try {
      setTeamsLoading(true);
      setTeamsError(null);

      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(PAGE_SIZE),
        search,
        from,
        to,
        ...(dept !== 'all' && { department: dept }),
        ...(currentSorting[0] && {
          sortBy: currentSorting[0].id,
          sortDir: currentSorting[0].desc ? 'desc' : 'asc',
        }),
      });

      const res = await fetch(`/api/teams?${params}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      setTeams(data.data ?? []);
      setTotalCount(data.totalCount ?? 0);

      /**
       * Only populate departments on the first unfiltered load so the
       * dropdown always shows all possible values, not just the current page.
       */
      if (!search && dept === 'all' && currentPage === 1 && data.departments) {
        setDepartments(data.departments);
      }
    } catch (err) {
      setTeamsError('Failed to load teams data');
      console.error('[useTeams]', err);
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  // Reset to page 1 when any filter changes to avoid showing an empty page
  useEffect(() => {
    setPage(1);
  }, [debouncedValue, sorting, from, to, department]);

  // Re-fetch whenever page, sort, search, or date range changes
  useEffect(() => {
    loadTeams(page, sorting, debouncedValue, department, from, to);
  }, [page, sorting, debouncedValue, from, to, department, loadTeams]);

  return {
    teams,
    teamsLoading,
    teamsError,
    sorting,
    setSorting,
    page,
    setPage,
    totalCount,
    departments,
  };
}