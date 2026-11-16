"use server";

import { redirect } from "next/navigation";
import { getStaffContext } from "@/lib/auth/staff-session";
import { messagePreviewPayload } from "@/lib/media/hash-preview";
import {
  buildMediaStoragePath,
  extensionFromContentType,
} from "@/lib/media/paths";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { MISSING_SERVICE_ROLE, MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { MAX_MEDIA_BYTES } from "@/lib/validations/ops";
import { isWorkOrderStatus } from "@/lib/work-orders/status";

export type StaffActionState = {
  error: string | null;
};

function mapStaffError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("invalid_token")) return "Oturum bitti. Tekrar PIN gir.";
  if (text.includes("invalid_transition")) return "Bu duruma geçilemez";
  if (text.includes("not_found")) return "Kayıt bulunamadı";
  if (text.includes("not_mechanic")) return "Bu işlem usta için";
  return message;
}

async function requireStaffToken() {
  const staff = await getStaffContext();
  if (!staff) redirect("/pin");
  return staff;
}

export async function staffSetStatusAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const staff = await requireStaffToken();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !isWorkOrderStatus(status)) return { error: "Geçersiz istek" };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("staff_set_work_order_status", {
    _token: staff.token,
    _id: id,
    _status: status,
  });
  if (error) return { error: mapStaffError(error.message) };
  redirect(`/lift/${id}`);
}

export async function staffRequestPartsAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const staff = await requireStaffToken();
  const id = String(formData.get("id") ?? "");
  const description = String(formData.get("description") ?? "Parça lazım");
  if (!id) return { error: "İş emri gerekli" };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("staff_request_parts", {
    _token: staff.token,
    _work_order_id: id,
    _description: description,
  });
  if (error) return { error: mapStaffError(error.message) };
  redirect(`/lift/${id}`);
}

export async function staffSetPartStatusAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const staff = await requireStaffToken();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return { error: "Geçersiz istek" };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("staff_set_part_status", {
    _token: staff.token,
    _id: id,
    _status: status,
  });
  if (error) return { error: mapStaffError(error.message) };
  redirect(staff.role === "apprentice" ? "/tasks" : "/parts");
}

export async function staffUploadMediaAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const staff = await requireStaffToken();
  const workOrderId = String(formData.get("workOrderId") ?? "");
  if (!workOrderId) return { error: "İş emri gerekli" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Fotoğraf seçilmedi. Bir görsel seçip tekrar dene." };
  }
  if (file.size > MAX_MEDIA_BYTES) {
    return { error: "Fotoğraf en fazla 5 MB olabilir." };
  }
  const contentType = file.type || "image/jpeg";
  if (!contentType.startsWith("image/")) {
    return { error: "Yalnız JPEG, PNG veya WebP yükle." };
  }

  const admin = createAdminSupabase();
  if (!admin) return { error: MISSING_SERVICE_ROLE };

  const path = buildMediaStoragePath(
    staff.workspaceId,
    workOrderId,
    extensionFromContentType(contentType),
  );
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from("work-order-media")
    .upload(path, buffer, { contentType, upsert: false });
  if (uploadError) {
    const msg = uploadError.message.toLowerCase();
    if (msg.includes("bucket") || msg.includes("not found")) {
      return {
        error:
          "Foto deposu yok. Supabase’te 004 SQL ve Storage bucket’ı kontrol et.",
      };
    }
    return { error: "Fotoğraf yüklenemedi. Bağlantıyı kontrol edip tekrar dene." };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const tagRaw = String(formData.get("tag") ?? "").trim();
  const tag =
    tagRaw === "entry_damage" ||
    tagRaw === "old_part" ||
    tagRaw === "new_part"
      ? tagRaw
      : null;

  const { error } = await supabase.rpc("staff_register_media", {
    _token: staff.token,
    _work_order_id: workOrderId,
    _storage_path: path,
    _content_type: contentType,
    _byte_size: file.size,
    _tag: tag,
  });
  if (error) {
    const text = error.message.toLowerCase();
    if (text.includes("does not exist") || text.includes("schema cache")) {
      return {
        error: "Foto kaydı yok. Proje kökünde npm run db:push çalıştır.",
      };
    }
    return { error: mapStaffError(error.message) };
  }
  redirect(`/lift/${workOrderId}`);
}

export async function staffLogWhatsAppAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const staff = await requireStaffToken();
  const workOrderId = String(formData.get("workOrderId") ?? "");
  const preview = String(formData.get("preview") ?? "");
  if (!workOrderId) return { error: "İş emri gerekli" };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("staff_log_message_event", {
    _token: staff.token,
    _work_order_id: workOrderId,
    _payload: messagePreviewPayload(preview),
  });
  if (error) return { error: mapStaffError(error.message) };
  return { error: null };
}
