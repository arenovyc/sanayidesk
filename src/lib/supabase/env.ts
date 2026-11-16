export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/** Auth callback / OAuth redirect base. Trailing slash stripped. */
export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

/** Yeni sb_publishable / sb_secret formatı — Legacy eyJ JWT tercih edilir */
export function usesNewStyleSupabaseKeys() {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  return anon.startsWith("sb_") || service.startsWith("sb_");
}

export const MISSING_SUPABASE_ENV =
  "Supabase env eksik. NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY gerekli.";

export const MISSING_SERVICE_ROLE =
  "SUPABASE_SERVICE_ROLE_KEY eksik. PIN ve personel için .env.local’e ekle.";

export function hasServiceRoleKey() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function parsePlatformAdminEmails() {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
