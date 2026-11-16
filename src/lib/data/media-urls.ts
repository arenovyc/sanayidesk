import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import type { MediaRow } from "@/lib/work-orders/types";

export async function signedMediaUrls(
  media: MediaRow[],
): Promise<Record<string, string>> {
  if (media.length === 0) return {};
  const supabase = await createServerSupabase();
  if (!supabase) return {};

  const out: Record<string, string> = {};
  await Promise.all(
    media.map(async (item) => {
      const { data } = await supabase.storage
        .from("work-order-media")
        .createSignedUrl(item.storagePath, 3600);
      if (data?.signedUrl) out[item.id] = data.signedUrl;
    }),
  );
  return out;
}
