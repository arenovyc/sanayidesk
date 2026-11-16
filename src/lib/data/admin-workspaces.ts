import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";

export type AdminWorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isSuspended: boolean;
  trialEndsAt: string | null;
  createdAt: string;
};

export async function listAdminWorkspaces(): Promise<{
  rows: AdminWorkspaceRow[];
  error: string | null;
}> {
  const admin = createAdminSupabase();
  if (!admin) {
    return { rows: [], error: "Service role yapılandırılmamış" };
  }

  const { data, error } = await admin
    .from("workspaces")
    .select("id, name, slug, plan, is_suspended, trial_ends_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    const msg = (error.message ?? "").toLowerCase();
    if (msg.includes("is_suspended") || msg.includes("trial_ends_at")) {
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
        })),
      };
    }
    return { rows: [], error: error.message };
  }

  return {
    error: null,
    rows: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      plan: row.plan,
      isSuspended: Boolean(
        (row as { is_suspended?: boolean }).is_suspended,
      ),
      trialEndsAt:
        (row as { trial_ends_at?: string | null }).trial_ends_at ?? null,
      createdAt: row.created_at,
    })),
  };
}
