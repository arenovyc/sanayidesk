import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { MembershipRole } from "@/lib/auth/roles";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export const STAFF_COOKIE = "sd_staff";

export type StaffContext = {
  token: string;
  membershipId: string;
  userId: string;
  workspaceId: string;
  role: Extract<MembershipRole, "mechanic" | "apprentice">;
  displayName: string;
  workspaceName: string;
  workspaceSlug: string;
  isSuspended: boolean;
};

export async function setStaffCookie(token: string) {
  const store = await cookies();
  store.set(STAFF_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearStaffCookie() {
  const store = await cookies();
  store.delete(STAFF_COOKIE);
}

export async function readStaffToken() {
  const store = await cookies();
  return store.get(STAFF_COOKIE)?.value ?? null;
}

export const getStaffContext = cache(async (): Promise<StaffContext | null> => {
  const token = await readStaffToken();
  if (!token || token.length < 16) return null;

  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("staff_whoami", { _token: token });
  if (error || !data) return null;

  const row = data as {
    membership_id?: string;
    user_id?: string;
    workspace_id?: string;
    role?: string;
    display_name?: string;
    workspace_name?: string;
    workspace_slug?: string;
    is_suspended?: boolean;
  };

  if (
    !row.membership_id ||
    !row.user_id ||
    !row.workspace_id ||
    !row.display_name ||
    !row.workspace_name ||
    !row.workspace_slug
  ) {
    return null;
  }
  if (row.role !== "mechanic" && row.role !== "apprentice") return null;

  return {
    token,
    membershipId: row.membership_id,
    userId: row.user_id,
    workspaceId: row.workspace_id,
    role: row.role,
    displayName: row.display_name,
    workspaceName: row.workspace_name,
    isSuspended: Boolean(row.is_suspended),
    workspaceSlug: row.workspace_slug,
  };
});

/** Prefer admin for bulk staff reads; fall back unavailable. */
export function staffDataClient() {
  return createAdminSupabase();
}
