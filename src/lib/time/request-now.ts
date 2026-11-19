import "server-only";
import { io } from "next/cache";

/**
 * Request-safe "now" under cacheComponents.
 * Prefer io() over connection() for wall-clock reads (Next 16 docs).
 */
export async function requestNowMs(): Promise<number> {
  await io();
  return Date.now();
}

export async function requestNow(): Promise<Date> {
  await io();
  return new Date();
}
