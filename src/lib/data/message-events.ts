import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";

export type MessageEventRow = {
  id: string;
  channel: string;
  createdAt: string;
  workOrderId: string | null;
  displayNo: string | null;
  payloadLen: number | null;
  payloadSha256: string | null;
};

function isMissingRelation(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find the table")
  );
}

export async function listRecentMessageEvents(
  workspaceId: string,
): Promise<{ rows: MessageEventRow[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  const { data, error } = await supabase
    .from("message_events")
    .select("id, channel, created_at, work_order_id, payload, work_orders(display_no)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    if (isMissingRelation(error)) return { rows: [], schemaMissing: true };
    throw error;
  }

  return {
    schemaMissing: false,
    rows: (data ?? []).map((row) => {
      const payload =
        row.payload && typeof row.payload === "object"
          ? (row.payload as { len?: unknown; sha256?: unknown })
          : {};
      const len =
        typeof payload.len === "number"
          ? payload.len
          : typeof payload.len === "string"
            ? Number(payload.len)
            : null;
      const sha =
        typeof payload.sha256 === "string" ? payload.sha256 : null;
      const woRaw = row.work_orders as unknown;
      const wo = Array.isArray(woRaw) ? woRaw[0] : woRaw;
      const displayNo =
        wo && typeof wo === "object" && "display_no" in wo
          ? ((wo as { display_no: string | null }).display_no ?? null)
          : null;
      return {
        id: row.id,
        channel: row.channel,
        createdAt: row.created_at,
        workOrderId: row.work_order_id,
        displayNo,
        payloadLen: Number.isFinite(len) ? (len as number) : null,
        payloadSha256: sha,
      };
    }),
  };
}
