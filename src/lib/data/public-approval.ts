import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { displayPlate } from "@/lib/format/plate";
import type {
  MediaTag,
  VehicleCheckup,
  WorkOrderItemRow,
} from "@/lib/work-orders/types";

export type PublicApprovalPayload = {
  workOrderId: string;
  status: string;
  shopName: string;
  shopPhone: string | null;
  plate: string;
  makeModel: string | null;
  entryKm: number | null;
  displayNo: string | null;
  complaint: string;
  due: number;
  items: WorkOrderItemRow[];
  media: {
    id: string;
    storagePath: string;
    tag: MediaTag | null;
    contentType: string;
    signedUrl: string | null;
  }[];
  approvedAt: string | null;
  hasQuestion: boolean;
  customerApprovalNote: string | null;
  vehicleCheckup: VehicleCheckup;
};

function parseCheckup(raw: unknown): VehicleCheckup {
  const out: VehicleCheckup = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (
      (key === "brake_pads" ||
        key === "tires" ||
        key === "battery" ||
        key === "wipers" ||
        key === "fluids" ||
        key === "belts") &&
      (value === "ok" || value === "soon" || value === "urgent")
    ) {
      out[key] = value;
    }
  }
  return out;
}

export async function loadPublicApproval(
  token: string,
): Promise<PublicApprovalPayload | null> {
  const supabase = (await createServerSupabase()) ?? createAdminSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("public_get_approval", {
    _token: token,
  });
  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const itemsRaw = (row.items as unknown[]) ?? [];
  const mediaRaw = (row.media as unknown[]) ?? [];

  const admin = createAdminSupabase();
  const media = await Promise.all(
    mediaRaw.map(async (item) => {
      const m = item as Record<string, unknown>;
      const storagePath = String(m.storage_path ?? "");
      const tagRaw = m.tag;
      const tag: MediaTag | null =
        tagRaw === "entry_damage" ||
        tagRaw === "old_part" ||
        tagRaw === "new_part"
          ? tagRaw
          : null;
      let signedUrl: string | null = null;
      if (admin && storagePath) {
        const { data: signed } = await admin.storage
          .from("work-order-media")
          .createSignedUrl(storagePath, 3600);
        signedUrl = signed?.signedUrl ?? null;
      }
      return {
        id: String(m.id ?? ""),
        storagePath,
        tag,
        contentType: String(m.content_type ?? "image/jpeg"),
        signedUrl,
      };
    }),
  );

  return {
    workOrderId: String(row.work_order_id ?? ""),
    status: String(row.status ?? ""),
    shopName: String(row.shop_name ?? "SanayiDesk"),
    shopPhone: row.shop_phone ? String(row.shop_phone) : null,
    plate: displayPlate(String(row.plate ?? "")),
    makeModel: row.make_model ? String(row.make_model) : null,
    entryKm:
      row.entry_km == null || !Number.isFinite(Number(row.entry_km))
        ? null
        : Number(row.entry_km),
    displayNo: row.display_no ? String(row.display_no) : null,
    complaint: String(row.complaint ?? ""),
    due: Number(row.due ?? 0),
    items: itemsRaw.map((item) => {
      const i = item as Record<string, unknown>;
      return {
        id: String(i.id ?? ""),
        kind: String(i.kind ?? "labor"),
        description: String(i.description ?? ""),
        amount: Number(i.amount ?? 0),
      };
    }),
    media,
    approvedAt: row.approved_at ? String(row.approved_at) : null,
    hasQuestion: Boolean(row.has_question),
    customerApprovalNote: row.customer_approval_note
      ? String(row.customer_approval_note)
      : null,
    vehicleCheckup: parseCheckup(row.vehicle_checkup),
  };
}
