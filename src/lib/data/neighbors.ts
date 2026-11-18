import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";

export type NeighborRequestRow = {
  id: string;
  kind: string;
  status: string;
  payload: Record<string, unknown>;
  fromWorkspaceId: string;
  toWorkspaceId: string | null;
  directoryContactId: string | null;
  createdAt: string;
  direction: "in" | "out";
};

function isMissing(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    msg.includes("neighbor_requests") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}

export async function listNeighborRequests(
  workspaceId: string,
): Promise<{ inbox: NeighborRequestRow[]; outbox: NeighborRequestRow[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return { inbox: [], outbox: [], schemaMissing: false };
  }

  const { data, error } = await supabase
    .from("neighbor_requests")
    .select(
      "id, kind, status, payload, from_workspace_id, to_workspace_id, directory_contact_id, created_at",
    )
    .or(`from_workspace_id.eq.${workspaceId},to_workspace_id.eq.${workspaceId}`)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    if (isMissing(error)) {
      return { inbox: [], outbox: [], schemaMissing: true };
    }
    throw error;
  }

  const inbox: NeighborRequestRow[] = [];
  const outbox: NeighborRequestRow[] = [];

  for (const row of data ?? []) {
    const mapped: NeighborRequestRow = {
      id: row.id,
      kind: row.kind,
      status: row.status,
      payload:
        row.payload && typeof row.payload === "object"
          ? (row.payload as Record<string, unknown>)
          : {},
      fromWorkspaceId: row.from_workspace_id,
      toWorkspaceId: row.to_workspace_id,
      directoryContactId: row.directory_contact_id,
      createdAt: row.created_at,
      direction: row.to_workspace_id === workspaceId ? "in" : "out",
    };
    if (mapped.direction === "in") inbox.push(mapped);
    else outbox.push(mapped);
  }

  return { inbox, outbox, schemaMissing: false };
}
