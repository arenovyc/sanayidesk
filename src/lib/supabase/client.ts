"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv, MISSING_SUPABASE_ENV } from "@/lib/supabase/env";

export function createBrowserSupabase() {
  const env = getSupabasePublicEnv();
  if (!env) throw new Error(MISSING_SUPABASE_ENV);
  return createBrowserClient(env.url, env.anonKey);
}
