"use client";

import { useEffect, useState } from "react";
import { PrintButton } from "@/components/desk/print-button";
import { cn } from "@/lib/utils";

export function PrintFormatToggle({
  approvalUrl,
}: {
  approvalUrl?: string | null;
}) {
  const [format, setFormat] = useState<"a4" | "thermal">("a4");

  useEffect(() => {
    document.documentElement.dataset.printFormat = format;
    return () => {
      delete document.documentElement.dataset.printFormat;
    };
  }, [format]);

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <div className="flex rounded-lg border border-neutral-200 p-0.5">
        <button
          type="button"
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium",
            format === "a4" ? "bg-neutral-900 text-white" : "text-neutral-600",
          )}
          onClick={() => setFormat("a4")}
        >
          A4 Servis Formu
        </button>
        <button
          type="button"
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium",
            format === "thermal"
              ? "bg-neutral-900 text-white"
              : "text-neutral-600",
          )}
          onClick={() => setFormat("thermal")}
        >
          80 mm Termal Fiş
        </button>
      </div>
      <PrintButton label="Yazdır / PDF" />
      {approvalUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(approvalUrl)}`}
          alt="Onay QR"
          width={48}
          height={48}
          className="hidden"
          data-print-qr=""
        />
      ) : null}
    </div>
  );
}
