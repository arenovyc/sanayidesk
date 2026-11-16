import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";

export type InventoryItem = {
  id: string;
  sku: string | null;
  name: string;
  qty: number;
  unitCost: number;
  minQty: number;
  updatedAt: string;
};

export type InventoryMovement = {
  id: string;
  itemId: string;
  kind: "in" | "out" | "adjust";
  qty: number;
  workOrderId: string | null;
  note: string;
  createdAt: string;
};

function isMissing(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("inventory_")
  );
}

export async function listInventoryItems(
  workspaceId: string,
): Promise<{ rows: InventoryItem[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  const { data, error } = await supabase
    .from("inventory_items")
    .select("id, sku, name, qty, unit_cost, min_qty, updated_at")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) {
    if (isMissing(error)) return { rows: [], schemaMissing: true };
    throw error;
  }

  return {
    schemaMissing: false,
    rows: (data ?? []).map((row) => ({
      id: row.id,
      sku: row.sku,
      name: row.name,
      qty: Number(row.qty),
      unitCost: Number(row.unit_cost),
      minQty: Number(row.min_qty),
      updatedAt: row.updated_at,
    })),
  };
}

export async function listInventoryMovements(
  workspaceId: string,
  itemId?: string,
): Promise<{ rows: InventoryMovement[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  let query = supabase
    .from("inventory_movements")
    .select("id, item_id, kind, qty, work_order_id, note, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (itemId) query = query.eq("item_id", itemId);

  const { data, error } = await query;
  if (error) {
    if (isMissing(error)) return { rows: [], schemaMissing: true };
    throw error;
  }

  return {
    schemaMissing: false,
    rows: (data ?? []).map((row) => ({
      id: row.id,
      itemId: row.item_id,
      kind: row.kind as InventoryMovement["kind"],
      qty: Number(row.qty),
      workOrderId: row.work_order_id,
      note: row.note ?? "",
      createdAt: row.created_at,
    })),
  };
}
