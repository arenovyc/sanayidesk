"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 print:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-950/40"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-neutral-200 bg-white p-4 shadow-lg",
          "pb-[max(1rem,env(safe-area-inset-bottom))]",
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-neutral-200" aria-hidden />
        {title ? (
          <h2 className="mb-3 text-base font-semibold text-neutral-950">{title}</h2>
        ) : null}
        {children}
      </div>
    </div>
  );
}
