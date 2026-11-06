/**
 * Browser stand-in for "next/server", used only by the live demo build so the
 * real API route handlers in src/app/api can run in the page.
 */
export class NextRequest extends Request {
  readonly nextUrl: URL;
  constructor(input: string | URL, init?: RequestInit) {
    super(input, init);
    this.nextUrl = new URL(this.url);
  }
}

export const NextResponse = {
  json(body: unknown, init?: ResponseInit) {
    const headers = new Headers(init?.headers);
    headers.set("content-type", "application/json");
    return new Response(JSON.stringify(body), { ...init, headers });
  },
};
