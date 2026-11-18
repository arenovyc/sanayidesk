"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { firstZodError } from "@/lib/validations/auth";
import { MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  waMeUrl,
  waNeighborJobReferMessage,
  waNeighborPartAskMessage,
} from "@/lib/format/wa-templates";

export type NeighborsActionState = {
  error: string | null;
  waUrl?: string | null;
};

function mapError(message: string): string {
  const t = message.toLowerCase();
  if (t.includes("target_required")) return "Hedef seç";
  if (t.includes("invalid_name")) return "İsim gerekli";
  if (t.includes("not_desk")) return "Yetki yok";
  return message;
}

const waAskSchema = z.object({
  name: z.string().trim().min(2, "İsim gerekli"),
  phone: z.string().trim().min(10, "Telefon gerekli"),
  askText: z.string().trim().min(3, "Ne sorduğunu yaz"),
  kind: z.enum(["parca_sorusu", "is_paslama"]),
});

export async function neighborWaAskAction(
  _prev: NeighborsActionState,
  formData: FormData,
): Promise<NeighborsActionState> {
  const ctx = await requireDeskSession();
  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const parsed = waAskSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    askText: String(formData.get("askText") ?? ""),
    kind: String(formData.get("kind") ?? "parca_sorusu"),
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const { data: shadow, error: shadowError } = await supabase.rpc(
    "desk_ensure_shadow_party",
    {
      _name: parsed.data.name,
      _phone: parsed.data.phone,
      _note: "Komşular WA",
    },
  );
  if (shadowError) return { error: mapError(shadowError.message) };

  const directoryId =
    shadow && typeof shadow === "object" && "directoryId" in shadow
      ? String((shadow as { directoryId: string }).directoryId)
      : null;

  const text =
    parsed.data.kind === "is_paslama"
      ? waNeighborJobReferMessage({
          shopName: ctx.workspace.name,
          summary: parsed.data.askText,
          shopPhone: ctx.workspace.settings.phone,
        })
      : waNeighborPartAskMessage({
          shopName: ctx.workspace.name,
          askText: parsed.data.askText,
          shopPhone: ctx.workspace.settings.phone,
        });

  const waUrl = waMeUrl(parsed.data.phone, text);
  if (!waUrl) return { error: "Telefon WhatsApp için uygun değil" };

  if (directoryId) {
    await supabase.rpc("desk_create_neighbor_request", {
      _kind: parsed.data.kind,
      _payload: { text: parsed.data.askText, via: "wa" },
      _to_workspace_id: null,
      _directory_contact_id: directoryId,
      _status: "wa_sent",
    });
  }

  return { error: null, waUrl };
}

const inAppSchema = z.object({
  toWorkspaceId: z.uuid("Dükkan seç"),
  askText: z.string().trim().min(3, "Mesaj yaz"),
  kind: z.enum(["parca_sorusu", "is_paslama", "stok_transfer_istegi"]),
});

export async function neighborInAppAskAction(
  _prev: NeighborsActionState,
  formData: FormData,
): Promise<NeighborsActionState> {
  await requireDeskSession();
  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const parsed = inAppSchema.safeParse({
    toWorkspaceId: String(formData.get("toWorkspaceId") ?? ""),
    askText: String(formData.get("askText") ?? ""),
    kind: String(formData.get("kind") ?? "parca_sorusu"),
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const { error } = await supabase.rpc("desk_create_neighbor_request", {
    _kind: parsed.data.kind,
    _payload: { text: parsed.data.askText },
    _to_workspace_id: parsed.data.toWorkspaceId,
    _directory_contact_id: null,
    _status: "open",
  });
  if (error) return { error: mapError(error.message) };
  redirect("/neighbors");
}

const respondSchema = z.object({
  id: z.uuid(),
  status: z.enum(["accepted", "rejected"]),
});

export async function neighborRespondAction(
  _prev: NeighborsActionState,
  formData: FormData,
): Promise<NeighborsActionState> {
  await requireDeskSession();
  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const parsed = respondSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    status: String(formData.get("status") ?? ""),
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const { error } = await supabase.rpc("desk_respond_neighbor_request", {
    _id: parsed.data.id,
    _status: parsed.data.status,
  });
  if (error) return { error: mapError(error.message) };
  redirect("/neighbors");
}
