import "server-only";
import {
  trialDaysLeft,
  type AdminWorkspaceRow,
} from "@/lib/data/admin-workspace-types";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requestNowMs } from "@/lib/time/request-now";

export type { AdminWorkspaceRow } from "@/lib/data/admin-workspace-types";
export { trialDaysLeft } from "@/lib/data/admin-workspace-types";

export async function listAdminWorkspaces(): Promise<{
  rows: AdminWorkspaceRow[];
  error: string | null;
}> {
  const nowMs = await requestNowMs();
  const admin = createAdminSupabase();
  if (!admin) {
    return { rows: [], error: "Service role yapılandırılmamış" };
  }

  const { data, error } = await admin
    .from("workspaces")
    .select(
      "id, name, slug, plan, is_suspended, trial_ends_at, created_at, city_district",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    const msg = (error.message ?? "").toLowerCase();
    if (
      msg.includes("is_suspended") ||
      msg.includes("trial_ends_at") ||
      msg.includes("city_district")
    ) {
      const legacy = await admin
        .from("workspaces")
        .select("id, name, slug, plan, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (legacy.error) return { rows: [], error: legacy.error.message };
      return {
        error: null,
        rows: (legacy.data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          plan: row.plan,
          isSuspended: false,
          trialEndsAt: null,
          createdAt: row.created_at,
          cityDistrict: null,
          ownerName: null,
          ownerPhone: null,
          workOrderCount: 0,
          mechanicCount: 0,
          lastActivityAt: null,
          daysLeft: null,
        })),
      };
    }
    return { rows: [], error: error.message };
  }

  const workspaces = data ?? [];
  if (workspaces.length === 0) {
    return { error: null, rows: [] };
  }

  const ids = workspaces.map((row) => row.id);

  const [membershipsRes, workOrdersRes] = await Promise.all([
    admin
      .from("memberships")
      .select("workspace_id, role, is_active, users(full_name, phone)")
      .in("workspace_id", ids)
      .eq("is_active", true),
    admin
      .from("work_orders")
      .select("workspace_id, opened_at")
      .in("workspace_id", ids),
  ]);

  const ownerByWs = new Map<
    string,
    { name: string | null; phone: string | null }
  >();
  const mechanicCountByWs = new Map<string, number>();

  for (const row of membershipsRes.data ?? []) {
    const wsId = row.workspace_id as string;
    const role = row.role as string;
    const userRaw = row.users as
      | { full_name?: string | null; phone?: string | null }
      | { full_name?: string | null; phone?: string | null }[]
      | null;
    const user = Array.isArray(userRaw) ? userRaw[0] : userRaw;

    if (role === "owner" && !ownerByWs.has(wsId)) {
      ownerByWs.set(wsId, {
        name: user?.full_name ?? null,
        phone: user?.phone ?? null,
      });
    }
    if (role === "mechanic" || role === "apprentice") {
      mechanicCountByWs.set(wsId, (mechanicCountByWs.get(wsId) ?? 0) + 1);
    }
  }

  const woCountByWs = new Map<string, number>();
  const lastActivityByWs = new Map<string, string>();

  for (const row of workOrdersRes.data ?? []) {
    const wsId = row.workspace_id as string;
    woCountByWs.set(wsId, (woCountByWs.get(wsId) ?? 0) + 1);
    const opened = row.opened_at as string | null;
    if (!opened) continue;
    const prev = lastActivityByWs.get(wsId);
    if (!prev || opened > prev) lastActivityByWs.set(wsId, opened);
  }

  return {
    error: null,
    rows: workspaces.map((row) => {
      const owner = ownerByWs.get(row.id);
      const trialEndsAt =
        (row as { trial_ends_at?: string | null }).trial_ends_at ?? null;
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        plan: row.plan,
        isSuspended: Boolean(
          (row as { is_suspended?: boolean }).is_suspended,
        ),
        trialEndsAt,
        createdAt: row.created_at,
        cityDistrict:
          (row as { city_district?: string | null }).city_district ?? null,
        ownerName: owner?.name ?? null,
        ownerPhone: owner?.phone ?? null,
        workOrderCount: woCountByWs.get(row.id) ?? 0,
        mechanicCount: mechanicCountByWs.get(row.id) ?? 0,
        lastActivityAt: lastActivityByWs.get(row.id) ?? null,
        daysLeft: trialDaysLeft(trialEndsAt, nowMs),
      };
    }),
  };
}
