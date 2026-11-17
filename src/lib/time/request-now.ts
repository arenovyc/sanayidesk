import "server-only";
import { connection } from "next/server";

/** Wait for a real request, then return "now" (safe under cacheComponents / PPR). */
export async function requestNowMs(): Promise<number> {
  await connection();
  return Date.now();
}

export async function requestNow(): Promise<Date> {
  await connection();
  return new Date();
}
