"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { messagePreviewPayload } from "@/lib/media/hash-preview";
import {
  approvalPageUrl,
  MISSING_SUPABASE_ENV,
} from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  acceptWorkOrderSchema,
  clearWorkOrderRemindSchema,
  firstWorkOrderZodError,
  setWorkOrderStatusSchema,
  shareQuoteApprovalSchema,
  updateJobIntakeSchema,
} from "@/lib/validations/work-order";

export type JobActionState = {
  error: string | null;
  approvalUrl?: string | null;
};

function mapJobError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("invalid_plate")) return "Plaka geçersiz";
  if (text.includes("not_desk")) return "Bu işlem için yetkin yok";
  if (text.includes("invalid_transition")) return "Bu duruma geçilemez";
  if (text.includes("unpaid_balance")) {
    return "Kalan ödeme var; veresiye ile devam için onayla.";
  }
  if (text.includes("not_found")) return "İş emri bulunamadı";
  if (text.includes("not_authenticated")) return "Oturum gerekli";
  if (text.includes("does not exist") || text.includes("schema cache")) {
    return "Şema eksik. npm run db:push (014–015).";
  }
  return message;
}

export async function acceptWorkOrderAction(
  _prev: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  await requireDeskSession();
  const parsed = acceptWorkOrderSchema.safeParse({
    plate: String(formData.get("plate") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    complaint: String(formData.get("complaint") ?? ""),
  });
  if (!parsed.success) {
    return { error: firstWorkOrderZodError(parsed.error) };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { data, error } = await supabase.rpc("accept_work_order", {
    _plate: parsed.data.plate,
    _full_name: parsed.data.fullName,
    _phone: parsed.data.phone,
    _complaint: parsed.data.complaint,
  });
  if (error) return { error: mapJobError(error.message) };

  const result = data as { id?: string; created?: boolean } | null;
  if (!result?.id) return { error: "İş emri açılamadı" };

  redirect(result.created ? `/jobs/${result.id}` : `/jobs/${result.id}?existing=1`);
}

function safeJobReturnTo(raw: string | undefined, jobId: string): string {
  const value = (raw ?? "").trim();
  if (value.startsWith("/board") || value.startsWith("/jobs/") || value === "/today") {
    return value;
  }
  return `/jobs/${jobId}`;
}

function formFlag(formData: FormData, key: string): string | undefined {
  const raw = formData.get(key);
  if (raw == null || raw === "") return undefined;
  return String(raw);
}

export async function setWorkOrderStatusAction(
  _prev: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  await requireDeskSession();
  const parsed = setWorkOrderStatusSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    status: String(formData.get("status") ?? ""),
    returnTo: String(formData.get("returnTo") ?? ""),
    allowUnpaid: formFlag(formData, "allowUnpaid"),
    setRemind: formFlag(formData, "setRemind"),
  });
  if (!parsed.success) {
    return { error: firstWorkOrderZodError(parsed.error) };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("set_work_order_status", {
    _id: parsed.data.id,
    _status: parsed.data.status,
    _allow_unpaid: Boolean(parsed.data.allowUnpaid),
    _set_remind: Boolean(parsed.data.setRemind),
  });
  if (error) return { error: mapJobError(error.message) };

  const dest = safeJobReturnTo(parsed.data.returnTo, parsed.data.id);
  if (dest === `/jobs/${parsed.data.id}` || dest.startsWith(`/jobs/${parsed.data.id}?`)) {
    revalidatePath(`/jobs/${parsed.data.id}`);
    return { error: null };
  }
  redirect(dest);
}

/** Sets waiting_approval + logs WA share; caller opens wa.me. */
export async function shareQuoteSetWaitingApprovalAction(
  _prev: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  await requireDeskSession();
  const parsed = shareQuoteApprovalSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    preview: String(formData.get("preview") ?? ""),
  });
  if (!parsed.success) {
    return { error: firstWorkOrderZodError(parsed.error) };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error: statusError } = await supabase.rpc("set_work_order_status", {
    _id: parsed.data.id,
    _status: "waiting_approval",
    _allow_unpaid: false,
    _set_remind: false,
  });
  if (statusError) {
    const msg = statusError.message.toLowerCase();
    // Already waiting_approval → same status is fine; still open WA.
    if (!msg.includes("invalid_transition")) {
      return { error: mapJobError(statusError.message) };
    }
  }

  const { data: token, error: tokenError } = await supabase.rpc(
    "desk_ensure_approval_token",
    { _work_order_id: parsed.data.id },
  );
  if (tokenError) {
    const msg = tokenError.message.toLowerCase();
    if (msg.includes("does not exist") || msg.includes("schema cache")) {
      return { error: "Şema eksik. npm run db:push (019)." };
    }
    return { error: mapJobError(tokenError.message) };
  }

  const approvalUrl =
    typeof token === "string" && token
      ? approvalPageUrl(token)
      : null;

  const previewWithLink =
    approvalUrl && parsed.data.preview && !parsed.data.preview.includes(approvalUrl)
      ? `${parsed.data.preview}\n\nOnay linki (giriş gerekmez):\n${approvalUrl}`
      : parsed.data.preview;

  if (previewWithLink) {
    await supabase.rpc("desk_log_message_event", {
      _work_order_id: parsed.data.id,
      _payload: messagePreviewPayload(previewWithLink),
    });
  }

  revalidatePath(`/jobs/${parsed.data.id}`);
  return { error: null, approvalUrl };
}

export async function clearWorkOrderRemindAction(
  _prev: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  await requireDeskSession();
  const parsed = clearWorkOrderRemindSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    returnTo: String(formData.get("returnTo") ?? ""),
  });
  if (!parsed.success) {
    return { error: firstWorkOrderZodError(parsed.error) };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("desk_clear_work_order_remind", {
    _id: parsed.data.id,
  });
  if (error) return { error: mapJobError(error.message) };

  redirect(parsed.data.returnTo?.startsWith("/") ? parsed.data.returnTo : "/today");
}

export async function updateJobIntakeAction(
  _prev: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  await requireDeskSession();
  const entryKmRaw = String(formData.get("entryKm") ?? "").trim();
  const parsed = updateJobIntakeSchema.safeParse({
    workOrderId: String(formData.get("workOrderId") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    complaint: String(formData.get("complaint") ?? ""),
    makeModel: String(formData.get("makeModel") ?? ""),
    entryKm: entryKmRaw === "" ? null : Number(entryKmRaw),
  });
  if (!parsed.success) {
    return { error: firstWorkOrderZodError(parsed.error) };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("desk_update_job_intake", {
    _work_order_id: parsed.data.workOrderId,
    _full_name: parsed.data.fullName,
    _phone: parsed.data.phone,
    _complaint: parsed.data.complaint,
    _make_model: parsed.data.makeModel,
    _entry_km: parsed.data.entryKm,
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("does not exist") || msg.includes("schema cache")) {
      return { error: "Şema eksik. npm run db:push (012/019)." };
    }
    return { error: mapJobError(error.message) };
  }

  revalidatePath(`/jobs/${parsed.data.workOrderId}`);
  return { error: null };
}

export async function clearApprovalQuestionAction(
  formData: FormData,
): Promise<void> {
  await requireDeskSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createServerSupabase();
  if (!supabase) return;

  await supabase.rpc("desk_clear_approval_question", {
    _work_order_id: id,
  });
  revalidatePath(`/jobs/${id}`);
}
