"use client";

import { useTransition } from "react";
import { staffLogWhatsAppAction } from "@/app/(lift)/actions";
import { waShareHref } from "@/lib/format/wa-phone";

export function StaffWhatsAppShare({
  workOrderId,
  preview,
}: {
  workOrderId: string;
  preview: string;
}) {
  const [pending, startTransition] = useTransition();
  const href = waShareHref(preview);

  return (
    <button
      type="button"
      disabled={pending}
      className="text-sm font-medium underline-offset-4 hover:underline disabled:opacity-50"
      onClick={() => {
        const fd = new FormData();
        fd.set("workOrderId", workOrderId);
        fd.set("preview", preview);
        startTransition(async () => {
          await staffLogWhatsAppAction({ error: null }, fd);
          window.open(href, "_blank", "noreferrer");
        });
      }}
    >
      WhatsApp paylaş
    </button>
  );
}
