import "server-only";
import { cache } from "react";
import {
  emptyNotificationCounts,
  type DeskNotificationCounts,
} from "@/lib/notifications/counts";
import { createServerSupabase } from "@/lib/supabase/server";

function isMissingRelation(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("desk_notification_counts")
  );
}

export const getDeskNotificationCounts = cache(async (
  workspaceId: string,
): Promise<{ counts: DeskNotificationCounts; schemaMissing: boolean }> => {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return { counts: emptyNotificationCounts(), schemaMissing: false };
  }

  const { data, error } = await supabase
    .from("desk_notification_counts")
    .select("b2b_pending, unassigned, ready, low_stock")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    if (isMissingRelation(error)) {
      return { counts: emptyNotificationCounts(), schemaMissing: true };
    }
    // Pre-008 view without low_stock column
    if ((error.message ?? "").toLowerCase().includes("low_stock")) {
      const legacy = await supabase
        .from("desk_notification_counts")
        .select("b2b_pending, unassigned, ready")
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      if (legacy.error) {
        if (isMissingRelation(legacy.error)) {
          return { counts: emptyNotificationCounts(), schemaMissing: true };
        }
        throw legacy.error;
      }
      return {
        schemaMissing: false,
        counts: {
          b2bPending: Number(legacy.data?.b2b_pending ?? 0),
          unassigned: Number(legacy.data?.unassigned ?? 0),
          ready: Number(legacy.data?.ready ?? 0),
          lowStock: 0,
        },
      };
    }
    throw error;
  }

  return {
    schemaMissing: false,
    counts: {
      b2bPending: Number(data?.b2b_pending ?? 0),
      unassigned: Number(data?.unassigned ?? 0),
      ready: Number(data?.ready ?? 0),
      lowStock: Number(
        (data as { low_stock?: number } | null)?.low_stock ?? 0,
      ),
    },
  };
});
