import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";

export type InventoryTransferRow = {
  id: string;
  fromWorkspaceId: string;
  toWorkspaceId: string;
  fromItemId: string;
  qty: number;
  note: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  itemName?: string;
  itemSku?: string | null;
};

function isMissing(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("inventory_transfer")
  );
}

function mapRow(row: {
  id: string;
  from_workspace_id: string;
  to_workspace_id: string;
  from_item_id: string;
  qty: number | string;
  note: string;
  status: string;
  created_at: string;
  inventory_items?: unknown;
}): InventoryTransferRow {
  const itemRaw = row.inventory_items as unknown;
  const item = Array.isArray(itemRaw) ? itemRaw[0] : itemRaw;
  const name =
    item && typeof item === "object" && "name" in item
      ? String((item as { name: string }).name)
      : undefined;
  const sku =
    item && typeof item === "object" && "sku" in item
      ? ((item as { sku: string | null }).sku ?? null)
      : undefined;

  return {
    id: row.id,
    fromWorkspaceId: row.from_workspace_id,
    toWorkspaceId: row.to_workspace_id,
    fromItemId: row.from_item_id,
    qty: Number(row.qty),
    note: row.note ?? "",
    status: row.status as InventoryTransferRow["status"],
    createdAt: row.created_at,
    itemName: name,
    itemSku: sku,
  };
}

export async function listInventoryTransfers(
  workspaceId: string,
): Promise<{ rows: InventoryTransferRow[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  const { data, error } = await supabase
    .from("inventory_transfer_requests")
    .select(
      "id, from_workspace_id, to_workspace_id, from_item_id, qty, note, status, created_at, inventory_items(name, sku)",
    )
    .or(
      `from_workspace_id.eq.${workspaceId},to_workspace_id.eq.${workspaceId}`,
    )
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    if (isMissing(error)) return { rows: [], schemaMissing: true };
    throw error;
  }

  return {
    schemaMissing: false,
    rows: (data ?? []).map(mapRow),
  };
}
