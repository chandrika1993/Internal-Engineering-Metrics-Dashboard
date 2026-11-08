/**
 * Live demo API: serves the app's /api/* requests inside the browser by
 * calling the real route handlers from src/app/api, which in turn run the
 * real queries on the in-browser database (see ./db.ts).
 */
import { NextRequest } from "./next-server";
import * as overview from "@/app/api/metrics/overview/route";
import * as trends from "@/app/api/metrics/trends/route";
import * as teams from "@/app/api/teams/route";
import * as team from "@/app/api/teams/[slug]/route";
import * as repo from "@/app/api/teams/[slug]/repos/[repoName]/route";
import { ready } from "./db";

type Handler = (req: never, ctx: never) => Promise<Response>;

const routes: { pattern: RegExp; keys: string[]; get: Handler }[] = [
  { pattern: /^\/api\/metrics\/overview\/?$/, keys: [], get: overview.GET as Handler },
  { pattern: /^\/api\/metrics\/trends\/?$/, keys: [], get: trends.GET as Handler },
  { pattern: /^\/api\/teams\/?$/, keys: [], get: teams.GET as Handler },
  { pattern: /^\/api\/teams\/([^/]+)\/?$/, keys: ["slug"], get: team.GET as Handler },
  { pattern: /^\/api\/teams\/([^/]+)\/repos\/([^/]+)\/?$/, keys: ["slug", "repoName"], get: repo.GET as Handler },
];

export async function handleDemoRequest(url: URL, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  for (const r of routes) {
    const m = url.pathname.match(r.pattern);
    if (!m) continue;
    if (method !== "GET") return new Response(null, { status: 405 });
    const params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]));
    await ready();
    try {
      return await r.get(new NextRequest(url) as never, { params: Promise.resolve(params) } as never);
    } catch (err) {
      console.error(err);
      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  }
  return Response.json({ error: "Not found" }, { status: 404 });
}

let installed = false;

/** Routes same-origin /api/* fetches to the in-browser API. */
export function installDemoFetch() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const realFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = input instanceof Request ? input.url : String(input);
    const url = new URL(raw, window.location.href);
    if (url.origin === window.location.origin && url.pathname.startsWith("/api/")) {
      const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
      if (signal?.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"));
      return handleDemoRequest(url, init ?? (input instanceof Request ? { method: input.method } : undefined));
    }
    return realFetch(input, init);
  };
  // Start booting the database right away, before the first request.
  void ready();
}
