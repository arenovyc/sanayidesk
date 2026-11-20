"use server";

import { requireDeskSession } from "@/lib/auth/get-membership";
import { MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
import type { VehicleCheckup } from "@/lib/work-orders/types";

export async function setVehicleCheckupAction(
  workOrderId: string,
  checkup: VehicleCheckup,
): Promise<{ error: string | null }> {
  await requireDeskSession();
  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("desk_set_vehicle_checkup", {
    _work_order_id: workOrderId,
    _checkup: checkup,
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("does not exist") || msg.includes("schema cache")) {
      return { error: "Şema eksik. npm run db:push (020)." };
    }
    return { error: error.message };
  }
  // No full-page revalidate — UI updates optimistically.
  return { error: null };
}
