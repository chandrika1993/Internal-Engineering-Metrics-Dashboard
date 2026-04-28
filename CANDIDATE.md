# DevPulse — Full Stack Engineering Challenge

## Context

You are taking over a codebase from an engineer who has left the company. The project is **DevPulse**, an internal dashboard used by engineering managers and tech leads to track team and repository performance across a ~200-person engineering organisation.

The dashboard surfaces four engineering metrics:

- **Deployment Frequency** — deployments per week, per team and repository
- **Lead Time for Changes** — median time from first commit to production deploy
- **PR Throughput** — pull requests merged per week
- **Incident Count** — production incidents per week, broken down by severity

The MVP was shipped but never polished. The app runs, but it has performance problems, rough interactions, and a few incomplete features. Your job is to identify and fix those issues, then extend the product with new functionality.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Next.js 15 (App Router), TypeScript 5.7 |
| Backend | Next.js API Route Handlers, TypeScript |
| Database | PostgreSQL 16 |
| Charts | Recharts 2.15 |
| Table | TanStack Table 8.21 |
| Styling | Tailwind CSS 4 |
| ORM | Drizzle ORM 0.39 |
| Package Manager | pnpm |

---

## Setup

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker

### Steps

```bash
# 1. Install dependencies
pnpm install

# 2. Start the database
docker compose up -d db

# 3. Run migrations
pnpm db:migrate

# 4. Seed the database
pnpm db:seed

# 5. Start the dev server
pnpm dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

---

## What Is Already Built

- **Dashboard overview** — 4 KPI cards (deployments, lead time, PR throughput, incidents), a deployment frequency chart, an incidents-over-time chart, and a searchable teams table
- **Team detail page** — `/teams/[slug]` showing per-team metrics, repository breakdown, and recent incidents
- **Compare page** — `/compare` exists as a stub with no implementation
- **API endpoints**:
  - `GET /api/metrics/overview` — aggregate KPI metrics; accepts a `severity` query parameter
  - `GET /api/metrics/trends` — time-series data; accepts `metric`, `weeks`, and `team` query parameters
  - `GET /api/teams` — list of all teams with stats
  - `GET /api/teams/[slug]` — detail for a single team
- **Database** — seeded with 8 teams, 24 repositories, ~15,000 deployments, ~9,000 pull requests, and ~600 incidents spanning 6 months

---

## Part 1 — Live Coding Session (60 minutes)

You will work through the tasks below while sharing your screen. The interviewer may ask questions about your reasoning as you go. You are free to use your editor, browser dev tools, and any documentation.

---

### Task 1 — Fix the slow teams endpoint

The `GET /api/teams` endpoint is noticeably slow. Identify what is causing it and fix it so the response is fast.

---

### Task 2 — Fix laggy table filtering

The teams table on the dashboard has a search input. Typing in it causes visible lag — frames drop and the UI feels unresponsive. Identify the root cause and fix it so filtering feels instant.

---

### Task 3 — Implement a severity filter for incidents

The overview page shows a total incident count KPI and an incidents-over-time chart. Add a severity filter — **Critical / High / Medium / Low** — that filters both the KPI card and the chart when a severity is selected.

The backend already supports this: `GET /api/metrics/overview` accepts a `severity` query parameter, and `GET /api/metrics/trends` is available for the chart data. The frontend does not yet use either.

---

## Part 2 — Take-Home Extension (4 hours)

Submit your work as a pull request to the provided repository. Include a written description in the PR body explaining what you built and any decisions you made.

---

### Task A — Team Comparison View (required)

Implement the `/compare` page. A user should be able to select between 2 and 3 teams and see their metrics displayed side by side — KPI values and trend lines overlaid on shared chart axes.

---

### Task B — Global Date Range Filter (required)

Add a date range control to the dashboard overview (default: last 30 days). When the range changes, all KPI cards, charts, and the teams table should update to reflect data from that range. The selected range must be reflected in the URL so the page is shareable.

---

### Task C — Pagination and Sorting on the Teams Table (required)

The teams table currently loads all data at once. Move pagination and sorting to the server. The page size should be 5 teams per page. Expose controls in the UI to navigate between pages and sort by any column.

---

### Task D — Loading, Empty, and Error States (required)

The app currently has no loading feedback, nothing shown when a query returns no results, and no user-facing indication of API failures. Add appropriate states for each of these three conditions across the dashboard — KPI cards, charts, and the teams table.

---

### Task E — Repository Drill-Down (stretch)

From the team detail page, make each repository row clickable. The destination page should show that repository's individual deployment history, merged pull requests, and incident timeline.

---

### Task F — Polish (stretch)

Improve any aspect of the codebase you think needs attention — typing, component organisation, accessibility, or responsiveness. Describe what you changed and why in your PR description.

---

### Task G — UI Improvement (bonus)

The current UI is functional but bare. Improve the visual quality of the dashboard without changing its layout or adding new features.

The goal is a **simple, professional interface** that an engineering manager would be comfortable using daily. Think considered use of whitespace, typography, colour, and visual hierarchy — not decoration.

A few areas worth considering, though you are not limited to these:

- Severity badges on incidents feel generic
- The KPI cards carry no visual weight or context
- Charts have no titles, axis labels, or units that help a first-time user orient
- The navigation has no active state
- Empty and loading moments (if you've implemented Task D) are an opportunity to reinforce the product's tone

**Constraints:**

- Do not introduce a new component library or design system — work within Tailwind CSS
- Do not change the page structure, routes, or layout
- Every change must have a reason; avoid decoration for its own sake

Include a short note in your PR description explaining the changes you made and the thinking behind them. Screenshots comparing before and after are strongly encouraged.

---

## Submission

- Open a pull request against the `main` branch of the provided repository
- Write a PR description that covers:
  - What you built and changed
  - Any tradeoffs or decisions worth noting
  - Anything you would do differently with more time
- Screenshots or a short screen recording are welcome but not required

---

## Notes

- Prioritise working software. A feature that works solidly is better than two features with rough edges.
- You are not expected to rewrite the project. Work within the existing structure unless you have a clear reason to deviate.
- If something is ambiguous, make a decision and note it in your PR description.
