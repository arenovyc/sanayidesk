import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { homeForRole, isCrewRole, isDeskRole, isLiftRole } from "@/lib/auth/roles";
import type { AppUser, Membership, SessionContext, Workspace } from "@/lib/auth/types";
import { getStaffContext, type StaffContext } from "@/lib/auth/staff-session";
import { parsePlatformAdminEmails } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";

export const getAuthUser = cache(async () => {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: appUser, error: userError } = await supabase
    .from("users")
    .select("id, auth_user_id, full_name, phone")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (userError) throw userError;
  if (!appUser) return null;

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("id, user_id, workspace_id, role, display_name, is_active, created_at")
    .eq("user_id", appUser.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) return null;

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, slug, type, plan, settings, is_suspended, trial_ends_at")
    .eq("id", membership.workspace_id)
    .maybeSingle();

  if (workspaceError) {
    // Pre-009 schemas may lack is_suspended / trial_ends_at
    const msg = (workspaceError.message ?? "").toLowerCase();
    if (
      msg.includes("is_suspended") ||
      msg.includes("trial_ends_at") ||
      msg.includes("column")
    ) {
      const fallback = await supabase
        .from("workspaces")
        .select("id, name, slug, type, plan, settings")
        .eq("id", membership.workspace_id)
        .maybeSingle();
      if (fallback.error) throw fallback.error;
      if (!fallback.data) return null;
      return buildSession(user.email ?? null, appUser as AppUser, membership as Membership, {
        ...fallback.data,
        is_suspended: false,
        trial_ends_at: null,
      });
    }
    throw workspaceError;
  }
  if (!workspace) return null;

  return buildSession(
    user.email ?? null,
    appUser as AppUser,
    membership as Membership,
    workspace,
  );
});

function buildSession(
  authEmail: string | null,
  appUser: AppUser,
  membership: Membership,
  workspace: {
    id: string;
    name: string;
    slug: string;
    type: string;
    plan: string;
    settings: unknown;
    is_suspended?: boolean | null;
    trial_ends_at?: string | null;
  },
): SessionContext {
  const rawSettings =
    workspace.settings &&
    typeof workspace.settings === "object" &&
    !Array.isArray(workspace.settings)
      ? (workspace.settings as Record<string, unknown>)
      : {};

  const settings = {
    phone: typeof rawSettings.phone === "string" ? rawSettings.phone : undefined,
    address:
      typeof rawSettings.address === "string" ? rawSettings.address : undefined,
    shareVehicleHistory: rawSettings.share_vehicle_history === true,
    networkVisible: rawSettings.network_visible === true,
  };

  return {
    authEmail,
    appUser,
    membership,
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      type: workspace.type as Workspace["type"],
      plan: workspace.plan,
      settings,
      isSuspended: Boolean(workspace.is_suspended),
      trialEndsAt: workspace.trial_ends_at ?? null,
    },
  };
}

function staffAsSession(staff: StaffContext): SessionContext {
  return {
    authEmail: null,
    appUser: {
      id: staff.userId,
      auth_user_id: null,
      full_name: staff.displayName,
      phone: null,
    },
    membership: {
      id: staff.membershipId,
      user_id: staff.userId,
      workspace_id: staff.workspaceId,
      role: staff.role,
      display_name: staff.displayName,
      is_active: true,
    },
    workspace: {
      id: staff.workspaceId,
      name: staff.workspaceName,
      slug: staff.workspaceSlug,
      type: "repair",
      plan: "trial",
      settings: {},
      isSuspended: staff.isSuspended,
      trialEndsAt: null,
    },
  };
}

async function requireSession(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (ctx) return ctx;
  const authUser = await getAuthUser();
  if (authUser) redirect("/register");
  redirect("/login");
}

function redirectIfSuspended(ctx: SessionContext) {
  if (ctx.workspace.isSuspended) redirect("/suspended");
}

export async function requireDeskSession() {
  const ctx = await requireSession();
  redirectIfSuspended(ctx);
  if (!isDeskRole(ctx.membership.role)) {
    redirect(homeForRole(ctx.membership.role));
  }
  return ctx;
}

export async function requireLiftSession() {
  const staff = await getStaffContext();
  if (staff && isLiftRole(staff.role)) {
    const session = staffAsSession(staff);
    redirectIfSuspended(session);
    return session;
  }
  const ctx = await getSessionContext();
  if (ctx && isLiftRole(ctx.membership.role)) {
    redirectIfSuspended(ctx);
    return ctx;
  }
  if (staff) redirect(homeForRole(staff.role));
  if (ctx) redirect(homeForRole(ctx.membership.role));
  redirect("/pin");
}

export async function requireCrewSession() {
  const staff = await getStaffContext();
  if (staff && isCrewRole(staff.role)) {
    const session = staffAsSession(staff);
    redirectIfSuspended(session);
    return session;
  }
  const ctx = await getSessionContext();
  if (ctx && isCrewRole(ctx.membership.role)) {
    redirectIfSuspended(ctx);
    return ctx;
  }
  if (staff) redirect(homeForRole(staff.role));
  if (ctx) redirect(homeForRole(ctx.membership.role));
  redirect("/pin");
}

export function isPlatformAdminEmail(email: string | null) {
  if (!email) return false;
  return parsePlatformAdminEmails().includes(email.toLowerCase());
}

export async function requirePlatformAdmin() {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");
  if (!isPlatformAdminEmail(authUser.email ?? null)) {
    const ctx = await getSessionContext();
    redirect(ctx ? homeForRole(ctx.membership.role) : "/today");
  }
  return authUser;
}
