# Engineering Metrics Dashboard

**Personal project · Full-stack engineering dashboard**

An internal engineering metrics dashboard I designed and built to help engineering leaders understand delivery health without moving between deployment, pull-request, and incident tools. The product combines an operational overview, server-driven team analytics, configurable date ranges, cross-team comparison, and repository-level drill-downs in one responsive interface.

Rather than treating metrics as a collection of static charts, the project focuses on making the underlying data layer reliable and scalable. Every dashboard interaction, from filtering a team list to changing the incident severity, is reflected consistently across the API, query layer, and UI.

> Screenshots are available in `./documentation/screenshots/`.
>
> - `Big Screens` contains laptop and tablet views.
> - `Small Screens (Mobile Devices)` contains mobile views.

## Highlights

- Built a responsive dashboard for team, deployment, pull-request, and incident health.
- Replaced an inefficient per-team aggregation pattern with database-side aggregates and server-side pagination.
- Made URL parameters the source of truth for date ranges, so views are shareable and browser navigation remains predictable.
- Added incident severity filtering that updates the relevant KPI and distribution chart together.
- Built a comparison workspace for evaluating two or three teams on shared KPI and trend axes.
- Added repository drill-down pages with deployment history, pull-request and incident timelines, and independent pagination.
- Designed loading, empty, and error states as first-class UI states rather than afterthoughts.
- Applied route-boundary validation, typed API helpers, request cancellation, and accessible interaction patterns throughout.

## Running the project

```bash
npm install
npm install use-debounce lucide-react
npm run dev
```

## Product scope

The dashboard is designed around the questions an engineering manager might ask in a daily operational review:

- Which teams are deploying frequently, and which are slowing down?
- Where are unresolved incidents accumulating?
- How do teams compare over the same time window?
- Which repositories are driving a team's operational profile?
- Can the data be filtered and explored without loading the entire organisation into the browser?

The resulting product has four connected levels of detail:

1. **Dashboard**: organisation-wide KPIs, deployment and incident trends, and a searchable team table.
2. **Comparison view**: side-by-side KPIs and shared trend charts for two or three teams.
3. **Team detail**: metrics and repository-level context for a single team.
4. **Repository drill-down**: delivery and incident history for an individual repository.

---

## Architecture and engineering decisions

### Server-driven team metrics

The team table is a primary entry point to the dashboard, so it needs to remain responsive as the number of teams and repositories grows. The first version of the data access pattern fetched repositories and then ran separate deployment, pull-request, and incident queries inside loops. For the seeded dataset of eight teams with roughly three repositories each, this would create approximately 65 database round-trips for one request.

I redesigned this path as `getTeamsWithStatsPaginated` in `src/lib/queries.ts`.

Instead of aggregating in application loops, the query builds four database-side subqueries:

- repository count by team
- deployments in the selected date range by team
- merged pull requests in the selected date range by team
- unresolved incidents in the selected date range by team

Those subqueries are left-joined to the teams table, so the current page of aggregated rows is returned by one data query. The matching total-count query runs concurrently, giving the client both the paginated result set and pagination metadata without serial network latency.

```ts
const repoCountSq = db
  .select({
    teamId: repositories.teamId,
    repoCount: sql<number>`count(*)`.as("repo_count"),
  })
  .from(repositories)
  .groupBy(repositories.teamId)
  .as("repo_counts");

const deployCountSq = db
  .select({
    teamId: repositories.teamId,
    deploysInRange: sql<number>`count(*)`.as("deploy_count"),
  })
  .from(deployments)
  .innerJoin(repositories, eq(deployments.repositoryId, repositories.id))
  .where(
    and(
      gte(deployments.deployedAt, fromDate),
      lte(deployments.deployedAt, toDate),
    ),
  )
  .groupBy(repositories.teamId)
  .as("deploy_counts");

// Pull-request and incident subqueries follow the same pattern.

const [rows, [{ count }]] = await Promise.all([
  db
    .select({ /* team fields and coalesced aggregate fields */ })
    .from(teams)
    .leftJoin(repoCountSq, eq(repoCountSq.teamId, teams.id))
    .leftJoin(deployCountSq, eq(deployCountSq.teamId, teams.id))
    .leftJoin(prCountSq, eq(prCountSq.teamId, teams.id))
    .leftJoin(incidentCountSq, eq(incidentCountSq.teamId, teams.id))
    .where(whereClause)
    .orderBy(orderExpr)
    .limit(pageSize)
    .offset((page - 1) * pageSize),
  db.select({ count: sql<number>`count(*)` }).from(teams).where(whereClause),
]);
```

#### Defensive query design

The API accepts sorting and filter parameters, so every user-controlled value is handled deliberately.

- **Sortable columns use an allow-list.** `sortBy` is mapped to explicitly defined SQL expressions rather than interpolated into a query.
- **Aggregate values are coalesced.** Teams with no deployments, merged pull requests, or open incidents within the selected window receive `0`, not `NULL`, so displayed values and numeric sorting remain consistent.
- **Pagination is server-side.** The browser receives only the requested page instead of the full organisation-wide data set.
- **The total count is fetched in parallel.** The table can calculate its page controls without a separate sequential request.

#### Index support

The migration adds composite indexes that align with the joins and date-window predicates used by the metrics queries:

```sql
CREATE INDEX idx_deployments_repo_deployed
  ON deployments(repository_id, deployed_at);

CREATE INDEX idx_pull_requests_repo_merged
  ON pull_requests(repository_id, merged_at);

CREATE INDEX idx_incidents_team_started
  ON incidents(team_id, started_at);

CREATE INDEX idx_incidents_severity
  ON incidents(severity);
```

The deployment and pull-request indexes support both team-level aggregation and the date-windowed metrics surfaces used elsewhere in the application.

---

### Fast, predictable table filtering

The team search input is designed to feel immediate without launching a request on every keystroke.

The dashboard stores the raw input value locally and debounces the value used by data hooks by 300 ms. That means a normal typing burst becomes one server request once the user pauses, rather than a sequence of overlapping fetches and table renders.

```tsx
const [searchQuery, setSearchQuery] = useState("");
const [debouncedValue] = useDebounce(searchQuery, 300);

const { teams, page, setPage, totalCount } =
  useTeams(debouncedValue, department, from, to);
```

TanStack Table is configured for manual sorting and manual pagination. It renders the result page returned by the API rather than re-filtering or re-sorting a larger in-memory collection.

```tsx
const table = useReactTable({
  data: data ?? [],
  columns,
  state: { sorting },
  onSortingChange: (updater) => {
    const next =
      typeof updater === "function" ? updater(sorting) : updater;
    onSortChange(next);
  },
  manualSorting: true,
  manualPagination: true,
  getCoreRowModel: getCoreRowModel(),
});
```

The page resets to page 1 whenever the debounced search, department, sort state, or date range changes. This avoids invalid states such as a user remaining on page 7 after narrowing the result set to only a handful of teams.

---

### Incident severity as a coherent dashboard lens

Incident severity is a dashboard-level concern rather than a team-table filter. I placed the segmented severity control inside the Incident Distribution card, directly beside the data it affects.

This placement makes the scope clear:

- team search and department filtering change the team list;
- severity changes the incident lens used by the incident KPI and distribution chart.

The shared type and configuration live in `src/lib/severity.ts`, ensuring that labels, colour classes, badges, and control states remain consistent everywhere in the application.

```ts
export type Severity = "critical" | "high" | "medium" | "low";
export type SeverityFilter = "all" | Severity;

export const SEVERITY_CONFIG: Record<SeverityFilter, {
  label: string;
  color: string;
  activeClass: string;
  bgClass: string;
  textClass: string;
  ringClass: string;
  borderClass: string;
}> = {
  all: { /* ... */ },
  critical: { /* ... */ },
  high: { /* ... */ },
  medium: { /* ... */ },
  low: { /* ... */ },
};
```

The control is implemented as an accessible radio group:

```tsx
<div role="radiogroup" className="flex items-center flex-wrap gap-1.5">
  {(Object.keys(SEVERITY_CONFIG) as SeverityFilter[]).map((level) => (
    <button
      key={level}
      role="radio"
      aria-checked={severity === level}
      onClick={() => setSeverity(level)}
      className={/* state-aware classes */}
    >
      {SEVERITY_CONFIG[level].label}
    </button>
  ))}
</div>
```

The selected severity is passed through `useMetrics` and `useTrends`, so the KPI card and chart refresh from the same filter state. The API validates severity values before they reach query logic, and the query layer applies the filter consistently to both total incidents and the per-severity distribution.

Each hook aborts its previous request when a filter changes. This prevents a slower response for an earlier selection from overwriting newer state.

---

### URL-backed date ranges

Date ranges affect every major metric, so the selected range is stored in the URL rather than held only in component state.

`src/hooks/useDateRange.ts` reads `from` and `to` from `useSearchParams`, with a default range of the previous 30 days through today. Updating the range uses `router.replace`, preserving a clean browser history while keeping the state shareable and reload-safe.

```ts
export function useDateRange() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const from = searchParams.get("from") ?? defaultFrom();
  const to = searchParams.get("to") ?? defaultTo();

  const setRange = useCallback(
    ({ from: newFrom, to: newTo }) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("from", newFrom);
      params.set("to", newTo);

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return { from, to, setRange };
}
```

The date picker uses two native date inputs with cross-bound `min` and `max` constraints. Users cannot choose an end date before the start date or a future end date.

On the server, `parseDateRange` normalises supplied dates to UTC day boundaries:

- start date: `00:00:00.000Z`
- end date: `23:59:59.999Z`

This gives all metrics the same inclusive date-window semantics. The application documents the small midnight-local edge case for non-UTC users, an acceptable trade-off for an internal dashboard with consistent server-side windows.

The selected range is threaded through every applicable API route:

- `/api/metrics/overview`
- `/api/metrics/trends`
- `/api/teams`
- `/api/teams/[slug]`

Repository detail pages retain their own range selector because those views support dedicated operational windows such as `7d`, `14d`, `monthly`, `quarterly`, and `yearly`.

---

### Team comparison workspace

The comparison page helps an engineering manager compare two or three teams against the same time range. It lives in:

- `src/app/compare/page.tsx`
- `src/app/compare/ComparePage.tsx`

Users select teams through a visual tile picker. The selection cap is enforced at the interaction boundary, and unavailable tiles become disabled once three teams are selected.

For each team, the page retrieves team detail, deployment trend data, and incident trend data concurrently. All selected teams are then loaded through an outer `Promise.all`, so total load time is determined by the slowest team request rather than the sum of sequential requests.

```ts
Promise.all(
  selectedSlugs.map(async (slug) => {
    const [detail, deploys, incidents] = await Promise.all([
      fetchJSON<TeamDetail>(`/api/teams/${slug}?from=${from}&to=${to}`),
      fetchJSON<TrendPoint[]>(
        `/api/metrics/trends?metric=deployments&from=${from}&to=${to}&team=${slug}`,
      ),
      fetchJSON<TrendPoint[]>(
        `/api/metrics/trends?metric=incidents&from=${from}&to=${to}&team=${slug}`,
      ),
    ]);

    return { slug, detail, deploys, incidents };
  }),
);
```

#### Comparison UI building blocks

- **`compare/TeamSelector.tsx`**: colour-coded tile selection with clear disabled states once the three-team limit is reached.
- **`compare/CompareKpiGrid.tsx`**: per-team comparison for deployments, cycle lead time, merged pull requests, and incidents. Best-performing values are marked with a `BEST` pill, with lower values correctly treated as better for lead time and incidents.
- **`compare/CompareCharts.tsx`**: deployment and incident line charts using shared axes. Trend points are merged against a union of all dates so comparisons stay aligned, while missing periods render as `0` rather than visual gaps.
- **`compare/CompareStates.tsx`**: intentional empty and loading states for the selection threshold and asynchronous data load.

The same URL-backed date range hook is used on the dashboard and comparison page, so a shared comparison link preserves the selected window.

---

### Repository-level drill-down

Every repository in a team detail view is interactive. Selecting one opens:

```text
/teams/[slug]/repos/[repoName]
```

Repository names are encoded with `encodeURIComponent` so the route remains robust if future repository names contain reserved URL characters.

The repository route validates the selected range against an explicit allow-list and then fetches deployment history, KPI data, merged pull requests, and incidents concurrently.

```ts
const [
  rawDeployments,
  recentDeploysFor7d,
  recentPRsFor7d,
  pagedPRs,
  pagedIncidents,
] = await Promise.all([
  getRepoDeploymentHistory(repo.id, cutoff),
  getRepoDeploymentHistory(repo.id, sevenDayCutoff),
  getRepoMergedPRs(repo.id, sevenDayCutoff),
  getRepoMergedPRsPaginated(repo.id, cutoff, prPage, PAGE_SIZE),
  getRepoIncidentsPaginated(repo.id, cutoff, incidentPage, PAGE_SIZE),
]);
```

#### Deployment chart semantics

Deployment history is reduced into a `Map` keyed by `yyyy-mm-dd` and pre-seeded for every day in the active range. This means zero-deployment days are shown explicitly as flat chart segments, which communicates a known absence of deployments rather than missing data.

#### Accurate active-incident state

The incident query returns both the current page of incidents and an `activeTotal` computed independently of pagination. The operational status indicator therefore reflects every unresolved incident in range, not only the entries visible on the current page.

The detail screen uses three tabs:

- **Velocity**: deployment history and delivery context
- **Pull Requests**: recent merged work with additions and deletions
- **Incidents**: a severity-coded timeline with resolved incident MTTR in hours

---

## Reliability, safety, and type discipline

### Centralised fetch handling

`src/lib/fetchJSON.ts` provides a typed `fetchJSON<T>` helper, a `FetchError` that preserves HTTP status, and an `isAbortError` predicate. This consolidates the basic transport contract and provides one place for future retry logic, telemetry, authentication headers, or tracing.

### Request cancellation

Any hook that fetches in `useEffect` owns an `AbortController` and aborts its previous request during cleanup. This avoids stale writes when users change severity, paginate, sort, or alter the date range quickly.

Expected aborts are filtered out rather than surfaced as errors, so user-driven navigation does not cause error-state flicker.

### Route-boundary validation

The API validates constrained inputs before they reach the query layer:

- metric and severity values are checked against literal allow-lists;
- repository ranges are validated through a type guard;
- team sort fields are resolved through an explicit mapping;
- date predicates use typed Drizzle helpers with parsed `Date` values.

This allows the query layer to operate on trusted, typed inputs rather than duplicating validation logic.

### Parameterised query patterns

The implementation avoids raw date-interval construction and manual SQL list interpolation.

For example, dynamic repository IDs are passed through Drizzle's `inArray` rather than manually joined into a SQL fragment:

```ts
inArray(deployments.repositoryId, repoIds)
```

The pattern remains parameterised and matches the same safety model used by `eq`, `gte`, and `lte`.

### Correct lead-time calculation

Cycle lead time is calculated from the median time between `first_commit_at` and `merged_at` for the selected team and date range:

```sql
percentile_cont(0.5) WITHIN GROUP (
  ORDER BY EXTRACT(EPOCH FROM (merged_at - first_commit_at)) / 3600
)
```

Using the median helps reduce the influence of unusually long-lived pull requests on the displayed metric.

### Shared domain types

Public application types are centralised in `src/types/index.ts`, including:

- `Team`
- `TeamWithStats`
- `OverviewMetrics`
- `TrendPoint`
- `TrendSeries`
- `Incident`
- `TeamDetail`
- `RepoDetail`
- `PaginationMeta`
- `SortParam`

Constrained UI values are represented as unions, including `SeverityFilter`, `DeploymentRange`, `TabId`, and related label maps. This prevents component-level string duplication and keeps the UI aligned with the data contract.

---

## Intentional UI states

Loading, empty, and error states are designed into every primary data surface. Skeleton dimensions mirror the final layout to minimise layout shift.

| Surface | Loading | Empty | Error |
| --- | --- | --- | --- |
| KPI cards | 32 px `h-32` pulsing panel | Value defaults to 0 where appropriate | Red-bordered card with contextual message |
| Deployment chart | `h-60` skeleton panel | Dashed placeholder with “No deployment data available” | Error panel with message |
| Incident chart | `h-60` skeleton panel | Dashed placeholder with “No incident data available” | Error panel with message |
| Teams table | Five skeleton rows | “No teams found” row or list item | `role="status"` error region |
| Comparison view | KPI and chart skeleton grid | Guided empty selection state | Inline fetch error below selector |
| Repository detail | Centred spinner | Per-tab empty rows | Retryable error panel |

Leaf components receive `loading` and `error` props and own their visual variants. That keeps page composition declarative and allows the same component behaviour to be reused elsewhere.

---

## Accessibility and responsive behaviour

The dashboard is intended to work comfortably on both desktop and mobile without duplicating business logic.

### Accessible interactions

- Table headers expose `aria-sort` and descriptive sorting labels.
- Pagination is wrapped in `<nav aria-label="Pagination">`.
- Disabled pagination controls use both visual styling and `aria-disabled`.
- Severity selection uses a radio-group pattern with `aria-checked`.
- Mobile team metrics use semantic `dl`, `dt`, and `dd` markup.
- Breadcrumbs expose hierarchical navigation on team and repository pages.

### Responsive team table

On `sm` and larger viewports, the team list is rendered as an HTML table. On mobile, the same data becomes a stacked card list with a two-column metric definition list. This preserves scanability without maintaining separate data paths.

### Navigation and route state

`MainNav.tsx` uses an exact check for the dashboard route and `startsWith` for deeper routes. This avoids the common issue where the dashboard link appears active for every route because all paths begin with `/`.

### Suspense boundaries

The dashboard and comparison routes wrap client components in `Suspense`, which is required for `useSearchParams` in the Next.js App Router during streaming and build-time rendering.

---

## Visual system

The visual direction is intentionally restrained and operational:

- **Severity language**: badges are generated from a single `SEVERITY_CONFIG`, making criticality colour and text consistent across cards, charts, controls, and incident lists.
- **KPI cards**: a compact icon, label, metric, and contextual filter pill establish hierarchy without making the dashboard feel decorative.
- **Charts**: titles, supporting subtitles, muted axes, and custom tooltips make trend views legible without relying on visual novelty.
- **Spacing**: consistent `space-y` rhythm and rounded containers create distinct information zones across dashboard, comparison, team, and repository views.
- **Operational feedback**: incident-free states use an “All Clear” message, while repository status pills surface live active-incident information rather than acting as static decoration.

---

## Project structure

```text
src/
├── app/
│   ├── api/
│   │   ├── metrics/
│   │   └── teams/
│   ├── compare/
│   └── teams/
├── components/
│   ├── compare/
│   ├── dashboard/
│   └── shared/
├── hooks/
│   ├── useDateRange.ts
│   ├── useMetrics.ts
│   ├── useTeams.ts
│   └── useTrends.ts
├── lib/
│   ├── fetchJSON.ts
│   ├── queries.ts
│   └── severity.ts
└── types/
    └── index.ts
```

---

## What I wanted to demonstrate

This project is an example of how I approach product engineering work: start with the user decisions the interface needs to support, trace those decisions through the data and API layers, and make reliability visible in the final experience.

The result is not simply a metrics screen. It is a scalable, shareable, and responsive operational tool with deliberate query design, clear state management, defensive inputs, and interfaces that help users move from organisation-level signals to repository-level context.

---

_Chandrika Mohan · Senior Full Stack Developer · Saarbrücken, Germany_  
_[chandrikamohan.com](https://chandrikamohan.com) · [github.com/chandrika1993](https://github.com/chandrika1993) · [linkedin.com/in/chandrikamohan](https://www.linkedin.com/in/chandrikamohan)_
