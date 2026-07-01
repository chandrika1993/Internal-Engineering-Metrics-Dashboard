# Internal Engineering Metrics Dashboard

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
    compare/              # Team comparison page (stub)
    page.tsx              # Dashboard overview
    layout.tsx            # Root layout with nav
  components/             # React components
  db/                     # Drizzle schema, connection, seed
  lib/                    # Query functions, utilities
  types/                  # Shared TypeScript types
```

### Complete Documentation

[Screenshoots - Small and Big Screens](/documentation/screenshots)

