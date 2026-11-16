"use client";

import { useState, useTransition } from "react";
import { shareQuoteSetWaitingApprovalAction } from "@/app/(desk)/jobs/actions";
import { waShareHref } from "@/lib/format/wa-phone";
import { waQuoteSummaryMessage } from "@/lib/format/wa-templates";

export function QuoteApprovalButton({
  workOrderId,
  preview,
  phone,
  disabled = false,
  shopName,
  plate,
  quoteLabel,
  shopPhone,
}: {
  workOrderId: string;
  preview: string;
  phone?: string | null;
  disabled?: boolean;
  shopName?: string;
  plate?: string;
  quoteLabel?: string;
  shopPhone?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending || disabled || !phone}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-amber-700 px-4 text-sm font-medium text-white disabled:opacity-50"
        onClick={() => {
          setError(null);
          const fd = new FormData();
          fd.set("id", workOrderId);
          fd.set("preview", preview);
          startTransition(async () => {
            const result = await shareQuoteSetWaitingApprovalAction(
              { error: null },
              fd,
            );
            if (result.error) {
              setError(result.error);
              return;
            }
            const fullPreview =
              shopName && plate && quoteLabel
                ? waQuoteSummaryMessage({
                    shopName,
                    plate,
                    quoteLabel,
                    shopPhone,
                    approvalUrl: result.approvalUrl,
                  })
                : result.approvalUrl && !preview.includes(result.approvalUrl)
                  ? `${preview}\n\nOnay linki (giriş gerekmez):\n${result.approvalUrl}`
                  : preview;
            window.open(waShareHref(fullPreview, phone), "_blank", "noreferrer");
          });
        }}
      >
        {pending ? "Gönderiliyor…" : "WhatsApp — fiyat onayı"}
      </button>
      {!phone ? (
        <p className="text-xs text-amber-800">
          Müşteri telefonu yok; önce kabul formunu tamamla.
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
