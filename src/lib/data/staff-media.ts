import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import type { MediaRow } from "@/lib/work-orders/types";

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

export async function listStaffJobMedia(
  workspaceId: string,
  workOrderId: string,
): Promise<{ media: MediaRow[]; urls: Record<string, string>; schemaMissing: boolean }> {
  const admin = createAdminSupabase();
  if (!admin) {
    const supabase = await createServerSupabase();
    if (!supabase) return { media: [], urls: {}, schemaMissing: false };
  }

  const client = createAdminSupabase() ?? (await createServerSupabase());
  if (!client) return { media: [], urls: {}, schemaMissing: false };

  const { data, error } = await client
    .from("media")
    .select("id, storage_path, content_type, byte_size, created_at")
    .eq("workspace_id", workspaceId)
    .eq("work_order_id", workOrderId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingRelation(error)) {
      return { media: [], urls: {}, schemaMissing: true };
    }
    throw error;
  }

  const media: MediaRow[] = (data ?? []).map((row) => ({
    id: row.id,
    storagePath: row.storage_path,
    contentType: row.content_type,
    byteSize: row.byte_size,
    createdAt: row.created_at,
  }));

  const urls: Record<string, string> = {};
  await Promise.all(
    media.map(async (item) => {
      const { data: signed } = await client.storage
        .from("work-order-media")
        .createSignedUrl(item.storagePath, 3600);
      if (signed?.signedUrl) urls[item.id] = signed.signedUrl;
    }),
  );

  return { media, urls, schemaMissing: false };
}
