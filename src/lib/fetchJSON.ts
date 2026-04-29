/**
 * Centralized fetch helper.
 * - Throws a typed error on non-2xx responses.
 * - Surfaces AbortError so callers can ignore it cleanly.
 * - Always parses JSON bodies.
 */
export class FetchError extends Error {
    constructor(public status: number, message: string) {
      super(message);
      this.name = "FetchError";
    }
  }
  
  export async function fetchJSON<T>(
    url: string,
    init?: RequestInit
  ): Promise<T> {
    const res = await fetch(url, init);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new FetchError(
        res.status,
        `Request failed [${res.status}]: ${text.slice(0, 200) || res.statusText}`
      );
    }
    return res.json() as Promise<T>;
  }
  
  export function isAbortError(err: unknown): boolean {
    return err instanceof Error && err.name === "AbortError";
  }