import { useState, useEffect } from 'react';
import { SortingState } from '@tanstack/react-table';
import type { TeamWithStats } from '@/types';
import { PAGE_SIZE } from '@/lib/utils';

export function useTeams(debouncedValue: string, department: string, from: string, to: string) {
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  async function loadTeams(
    currentPage: number,
    currentSorting: SortingState,
    search: string,
    dept: string,
    from: string,
    to: string
  ) {
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
    } catch (err) {
      setTeamsError('Failed to load teams data');
    } finally {
      setTeamsLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [debouncedValue, sorting, from, to, department]);

  useEffect(() => {
    loadTeams(page, sorting, debouncedValue, department, from, to);
  }, [page, sorting, debouncedValue, from, to, department]);

  // 1. Extract department values, which may include nulls
  const allDepartmentsWithNulls = teams.map(t => t.department);
  
  // 2. Filter out null or undefined values using a type guard
  const nonNullDepartments = allDepartmentsWithNulls.filter((d): d is string => !!d);
  
  // 3. Get a unique set of departments and sort them
  const departments = Array.from(new Set(nonNullDepartments)).sort();

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
