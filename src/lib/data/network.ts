import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";

export type NetworkShop = {
  id: string;
  name: string;
  slug: string;
  type: string;
  phone: string;
  address: string;
  isMine: boolean;
};

export type SharedPlateSummary = {
  workspaceId: string;
  workspaceName: string;
  plate: string;
  jobCount: number;
  lastAt: string | null;
  lastStatus: string | null;
};

function isMissingRpc(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST202" ||
    error.code === "42883" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("list_network_shops") ||
    msg.includes("desk_lookup_shared_plate")
  );
}

export async function listNetworkShops(): Promise<{
  rows: NetworkShop[];
  schemaMissing: boolean;
}> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  const { data, error } = await supabase.rpc("list_network_shops");
  if (error) {
    if (isMissingRpc(error)) return { rows: [], schemaMissing: true };
    throw error;
  }

  const raw = Array.isArray(data) ? data : [];
  return {
    schemaMissing: false,
    rows: raw.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      name: String(row.name ?? ""),
      slug: String(row.slug ?? ""),
      type: String(row.type ?? "repair"),
      phone: String(row.phone ?? ""),
      address: String(row.address ?? ""),
      isMine: Boolean(row.is_mine),
    })),
  };
}

export async function lookupSharedPlateHistory(plate: string): Promise<{
  rows: SharedPlateSummary[];
  schemaMissing: boolean;
  error: string | null;
}> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return { rows: [], schemaMissing: false, error: "Supabase yapılandırılmamış" };
  }

  const { data, error } = await supabase.rpc("desk_lookup_shared_plate_history", {
    _plate: plate,
  });
  if (error) {
    if (isMissingRpc(error)) {
      return { rows: [], schemaMissing: true, error: null };
    }
    return { rows: [], schemaMissing: false, error: error.message };
  }

  const raw = Array.isArray(data) ? data : [];
  return {
    schemaMissing: false,
    error: null,
    rows: raw.map((row: Record<string, unknown>) => ({
      workspaceId: String(row.workspace_id),
      workspaceName: String(row.workspace_name ?? ""),
      plate: String(row.plate ?? plate),
      jobCount: Number(row.job_count ?? 0),
      lastAt: row.last_at ? String(row.last_at) : null,
      lastStatus: row.last_status ? String(row.last_status) : null,
    })),
  };
}
