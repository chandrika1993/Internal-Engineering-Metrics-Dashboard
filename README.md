# Internal Engineering Metrics Dashboard

An internal engineering metrics dashboard I designed and built to help engineering leaders understand delivery health without moving between deployment, pull-request, and incident tools. The product combines an operational overview, server-driven team analytics, configurable date ranges, cross-team comparison, and repository-level drill-downs in one responsive interface.

Rather than treating metrics as a collection of static charts, the project focuses on making the underlying data layer reliable and scalable. Every dashboard interaction, from filtering a team list to changing the incident severity, is reflected consistently across the API, query layer, and UI.

## Live Demo

**[chandrika-metrics-demo.web.app](https://chandrika-metrics-demo.web.app)**

The demo is a static build of the same app, with no server. PostgreSQL runs in the browser through [PGlite](https://pglite.dev) (Postgres compiled to WebAssembly). On first load the page runs the project's Drizzle migration, fills the tables with the same seed script as `npm run db:seed` (with a fixed random seed, so the data is the same on every visit), and then answers each `/api/*` request by calling the real route handlers and queries in `src/app/api` and `src/lib`. The demo wiring lives in `src/demo`.

Build and deploy it to Firebase Hosting (free Spark plan):

```bash
firebase hosting:sites:create chandrika-metrics-demo   # once
npm run deploy:demo
```

`npm run build:demo` alone writes the static site to `out/`.

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker (for PostgreSQL)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
docker compose up -d db

# 3. Run database migrations
pnpm db:migrate

# 4. Seed the database
pnpm db:seed

# 5. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database

PostgreSQL runs on `localhost:5434`:
- User: `devpulse`
- Password: `devpulse`
- Database: `devpulse`

To reset the database, re-run `pnpm db:seed` (it clears existing data first).

To inspect the DB interactively: `pnpm db:studio`

### Project Structure

```
src/
  app/                    # Next.js App Router pages & API routes
    api/                  # Backend API endpoints
      teams/              # GET /api/teams, GET /api/teams/[slug]
      metrics/            # GET /api/metrics/overview, GET /api/metrics/trends
    teams/[slug]/         # Team detail page
      repos/[repoName]/   # Repository drill-down page
    compare/              # Team comparison page
    page.tsx              # Dashboard overview
    layout.tsx            # Root layout with nav
  components/             # React components
  db/                     # Drizzle schema, connection, seed
  lib/                    # Query functions, utilities
  types/                  # Shared TypeScript types
```

### Complete Documentation

[Screenshoots - Small and Big Screens](/documentation/screenshots)

[Documentation](/documentation/documentation.md)

