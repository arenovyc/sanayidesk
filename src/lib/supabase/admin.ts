import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

export function createAdminSupabase() {
  const env = getSupabasePublicEnv();
  const key = getServiceRoleKey();
  if (!env || !key) return null;
  return createClient(env.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
