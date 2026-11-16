"use client";

import { useTransition } from "react";
import { logWhatsAppShareAction } from "@/app/(desk)/jobs/money-actions";
import { waShareHref } from "@/lib/format/wa-phone";

export function WhatsAppShareButton({
  workOrderId,
  preview,
  phone,
  label = "WhatsApp paylaş",
  emphasized = false,
}: {
  workOrderId: string;
  preview: string;
  phone?: string | null;
  label?: string;
  emphasized?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const href = waShareHref(preview, phone);

  return (
    <button
      type="button"
      disabled={pending}
      className={
        emphasized
          ? "inline-flex h-11 w-full items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white disabled:opacity-50"
          : "text-sm font-medium underline-offset-4 hover:underline disabled:opacity-50"
      }
      onClick={() => {
        const fd = new FormData();
        fd.set("workOrderId", workOrderId);
        fd.set("preview", preview);
        startTransition(async () => {
          await logWhatsAppShareAction({ error: null }, fd);
          window.open(href, "_blank", "noreferrer");
        });
      }}
    >
      {pending ? "Açılıyor…" : label}
    </button>
  );
}

export function WhatsAppShareHint() {
  return (
    <p className="text-xs text-neutral-500">
      WhatsApp açılır; mesajı sen gönderirsin.
    </p>
  );
}
