import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";

export type InventoryItem = {
  id: string;
  sku: string | null;
  name: string;
  qty: number;
  reservedQty: number;
  availableQty: number;
  unitCost: number;
  minQty: number;
  updatedAt: string;
};

export type InventoryMovement = {
  id: string;
  itemId: string;
  kind: "in" | "out" | "adjust" | "reserve" | "release";
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
  opts?: { includeReserved?: boolean },
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

  const baseRows = (data ?? []).map((row) => ({
    id: row.id,
    sku: row.sku as string | null,
    name: row.name as string,
    qty: Number(row.qty),
    unitCost: Number(row.unit_cost),
    minQty: Number(row.min_qty),
    updatedAt: row.updated_at as string,
  }));

  if (opts?.includeReserved === false) {
    return {
      schemaMissing: false,
      rows: baseRows.map((row) => ({
        ...row,
        reservedQty: 0,
        availableQty: Math.max(0, row.qty),
      })),
    };
  }

  // One movements scan instead of N× inventory_reserved_qty RPCs.
  const { data: moveRows, error: moveError } = await supabase
    .from("inventory_movements")
    .select("item_id, kind, qty")
    .eq("workspace_id", workspaceId)
    .in("kind", ["reserve", "release"]);

  if (moveError) {
    if (isMissing(moveError)) {
      return {
        schemaMissing: false,
        rows: baseRows.map((row) => ({
          ...row,
          reservedQty: 0,
          availableQty: Math.max(0, row.qty),
        })),
      };
    }
    throw moveError;
  }

  const reservedByItem = new Map<string, number>();
  for (const move of moveRows ?? []) {
    const kind = move.kind as string;
    const qty = Number(move.qty);
    if (!Number.isFinite(qty)) continue;
    const delta = kind === "reserve" ? qty : kind === "release" ? -qty : 0;
    if (delta === 0) continue;
    const itemId = move.item_id as string;
    reservedByItem.set(itemId, (reservedByItem.get(itemId) ?? 0) + delta);
  }

  return {
    schemaMissing: false,
    rows: baseRows.map((row) => {
      const reservedQty = Math.max(0, reservedByItem.get(row.id) ?? 0);
      return {
        ...row,
        reservedQty,
        availableQty: Math.max(0, row.qty - reservedQty),
      };
    }),
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
