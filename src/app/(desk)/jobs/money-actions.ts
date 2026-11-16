"use server";

import { redirect } from "next/navigation";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { messagePreviewPayload } from "@/lib/media/hash-preview";
import {
  buildMediaStoragePath,
  extensionFromContentType,
} from "@/lib/media/paths";
import { MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  firstOpsZodError,
  addItemSchema,
  addPartSchema,
  addPaymentSchema,
  MAX_MEDIA_BYTES,
  mediaUploadSchema,
  voidPaymentSchema,
} from "@/lib/validations/ops";

export type MoneyActionState = {
  error: string | null;
};

function mapMoneyError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("no_items")) return "Önce kalem ekle";
  if (text.includes("overpay")) return "Tutar kalan bakiyeden fazla";
  if (text.includes("invalid_amount")) return "Tutar geçersiz";
  if (text.includes("not_desk")) return "Bu işlem için yetkin yok";
  if (text.includes("not_found")) return "Kayıt bulunamadı";
  if (text.includes("already_voided")) return "Bu ödeme zaten iptal";
  if (text.includes("not_owner") || text.includes("not_owner")) {
    return "Yalnız patron iptal edebilir";
  }
  return message;
}

export async function addWorkOrderItemAction(
  _prev: MoneyActionState,
  formData: FormData,
): Promise<MoneyActionState> {
  const ctx = await requireDeskSession();
  const parsed = addItemSchema.safeParse({
    workOrderId: String(formData.get("workOrderId") ?? ""),
    kind: String(formData.get("kind") ?? "labor"),
    description: String(formData.get("description") ?? ""),
    amount: String(formData.get("amount") ?? ""),
  });
  if (!parsed.success) return { error: firstOpsZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.from("work_order_items").insert({
    workspace_id: ctx.workspace.id,
    work_order_id: parsed.data.workOrderId,
    kind: parsed.data.kind,
    description: parsed.data.description,
    amount: parsed.data.amount,
  });
  if (error) return { error: mapMoneyError(error.message) };
  redirect(`/jobs/${parsed.data.workOrderId}`);
}

export async function addPaymentAction(
  _prev: MoneyActionState,
  formData: FormData,
): Promise<MoneyActionState> {
  await requireDeskSession();
  const parsed = addPaymentSchema.safeParse({
    workOrderId: String(formData.get("workOrderId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    method: String(formData.get("method") ?? "cash"),
    invoiceMode: String(formData.get("invoiceMode") ?? "uninvoiced"),
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) return { error: firstOpsZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("desk_add_payment", {
    _work_order_id: parsed.data.workOrderId,
    _amount: parsed.data.amount,
    _method: parsed.data.method,
    _invoice_mode: parsed.data.invoiceMode,
    _note: parsed.data.note,
  });
  if (error) return { error: mapMoneyError(error.message) };
  redirect(`/jobs/${parsed.data.workOrderId}`);
}

export async function addPartRequestAction(
  _prev: MoneyActionState,
  formData: FormData,
): Promise<MoneyActionState> {
  const ctx = await requireDeskSession();
  const parsed = addPartSchema.safeParse({
    workOrderId: String(formData.get("workOrderId") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
  if (!parsed.success) return { error: firstOpsZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.from("part_requests").insert({
    workspace_id: ctx.workspace.id,
    work_order_id: parsed.data.workOrderId,
    description: parsed.data.description,
    status: "open",
  });
  if (error) return { error: mapMoneyError(error.message) };
  redirect(`/jobs/${parsed.data.workOrderId}`);
}

export async function voidPaymentAction(
  _prev: MoneyActionState,
  formData: FormData,
): Promise<MoneyActionState> {
  const ctx = await requireDeskSession();
  if (ctx.membership.role !== "owner") {
    return { error: "Yalnız patron iptal edebilir" };
  }
  const parsed = voidPaymentSchema.safeParse({
    paymentId: String(formData.get("paymentId") ?? ""),
    workOrderId: String(formData.get("workOrderId") ?? ""),
  });
  if (!parsed.success) return { error: firstOpsZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("desk_void_payment", {
    _payment_id: parsed.data.paymentId,
  });
  if (error) return { error: mapMoneyError(error.message) };
  redirect(`/jobs/${parsed.data.workOrderId}`);
}

export async function logWhatsAppShareAction(
  _prev: MoneyActionState,
  formData: FormData,
): Promise<MoneyActionState> {
  await requireDeskSession();
  const workOrderId = String(formData.get("workOrderId") ?? "");
  const preview = String(formData.get("preview") ?? "");
  if (!workOrderId) return { error: "İş emri gerekli" };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("desk_log_message_event", {
    _work_order_id: workOrderId,
    _payload: messagePreviewPayload(preview),
  });
  if (error) return { error: mapMoneyError(error.message) };
  return { error: null };
}

export async function uploadJobMediaAction(
  _prev: MoneyActionState,
  formData: FormData,
): Promise<MoneyActionState> {
  const ctx = await requireDeskSession();
  const parsed = mediaUploadSchema.safeParse({
    workOrderId: String(formData.get("workOrderId") ?? ""),
  });
  if (!parsed.success) return { error: firstOpsZodError(parsed.error) };

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

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const path = buildMediaStoragePath(
    ctx.workspace.id,
    parsed.data.workOrderId,
    extensionFromContentType(contentType),
  );
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("work-order-media")
    .upload(path, buffer, { contentType, upsert: false });
  if (uploadError) {
    const msg = uploadError.message.toLowerCase();
    if (msg.includes("bucket") || msg.includes("not found")) {
      return {
        error:
          "Foto deposu yok. npm run db:push ve Storage bucket work-order-media’yı kontrol et.",
      };
    }
    return { error: "Fotoğraf yüklenemedi. Bağlantıyı kontrol edip tekrar dene." };
  }

  const { error } = await supabase.from("media").insert({
    workspace_id: ctx.workspace.id,
    work_order_id: parsed.data.workOrderId,
    storage_path: path,
    content_type: contentType,
    byte_size: file.size,
    created_by_user_id: ctx.appUser.id,
  });
  if (error) {
    if (isMissingRelationLike(error.message)) {
      return {
        error: "Foto tablosu yok. Proje kökünde npm run db:push çalıştır.",
      };
    }
    return { error: mapMoneyError(error.message) };
  }
  redirect(`/jobs/${parsed.data.workOrderId}`);
}

function isMissingRelationLike(message: string): boolean {
  const text = message.toLowerCase();
  return (
    text.includes("does not exist") ||
    text.includes("schema cache") ||
    text.includes("could not find the table")
  );
}
