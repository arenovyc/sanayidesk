"use server";

import { redirect } from "next/navigation";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { lookupSharedPlateHistory } from "@/lib/data/network";
import { MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
export type NetworkActionState = {
  error: string | null;
};

export async function updateNetworkSettingsAction(
  _prev: NetworkActionState,
  formData: FormData,
): Promise<NetworkActionState> {
  const ctx = await requireDeskSession();
  if (ctx.membership.role !== "owner") redirect("/more");

  const shareVehicleHistory = formData.get("shareVehicleHistory") === "on";
  const networkVisible = formData.get("networkVisible") === "on";

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("owner_update_network_settings", {
    _share_vehicle_history: shareVehicleHistory,
    _network_visible: networkVisible,
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("does not exist") || msg.includes("schema cache")) {
      return { error: "Şema eksik. npm run db:push" };
    }
    return { error: error.message };
  }
  redirect("/settings");
}

export async function lookupSharedPlateAction(plate: string) {
  await requireDeskSession();
  return lookupSharedPlateHistory(plate);
}

export async function linkPartyWorkspaceAction(
  _prev: NetworkActionState,
  formData: FormData,
): Promise<NetworkActionState> {
  await requireDeskSession();
  const partyId = String(formData.get("partyId") ?? "").trim();
  const linked = String(formData.get("linkedWorkspaceId") ?? "").trim();
  if (!partyId) return { error: "Taşeron gerekli" };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("desk_set_party_linked_workspace", {
    _party_id: partyId,
    _linked_workspace_id: linked || null,
  });
  if (error) return { error: error.message };

  const returnTo = String(formData.get("returnTo") ?? "").trim();
  if (returnTo.startsWith("/b2b")) redirect(returnTo);
  redirect("/b2b");
}
