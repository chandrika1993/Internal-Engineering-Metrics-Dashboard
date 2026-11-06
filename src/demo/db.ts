/**
 * Live demo database: the real Drizzle schema and queries running on PGlite
 * (PostgreSQL compiled to WebAssembly) inside the browser. The demo build
 * points "@/db" here instead of src/db/index.ts.
 *
 * PGlite starts on first use. It loads its WebAssembly files from /pglite/
 * (copied there by scripts/build-demo.mjs), runs the project's migration and
 * fills the tables with the same seed script as `npm run db:seed`, using a
 * seeded random generator so every visitor sees the same data.
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seedData";
import migration from "../../drizzle/migrations/0000_ancient_maggott.sql";

/** Small, fast, seeded PRNG (mulberry32). */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let started: Promise<PGlite> | null = null;

async function start(): Promise<PGlite> {
  const [wasm, data] = await Promise.all([
    WebAssembly.compileStreaming(fetch("/pglite/pglite.wasm")),
    fetch("/pglite/pglite.data").then((r) => r.blob()),
  ]);
  const pg = await PGlite.create({ pgliteWasmModule: wasm, fsBundle: data });
  await pg.exec(migration.replace(/--> statement-breakpoint/g, ""));
  await seedDatabase(drizzle({ client: pg }), seeded(20250501));
  return pg;
}

/** Resolves once the database is created and seeded. */
export function ready(): Promise<PGlite> {
  started ??= start();
  return started;
}

// Drizzle only calls query() and transaction() on its client, so a thin
// wrapper lets `db` exist right away while PGlite boots in the background.
const client = {
  query: async (...args: Parameters<PGlite["query"]>) => (await ready()).query(...args),
  transaction: async (...args: Parameters<PGlite["transaction"]>) => (await ready()).transaction(...args),
} as unknown as PGlite;

export const db = drizzle({ client, schema });
