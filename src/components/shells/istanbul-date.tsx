"use client";

import { useSyncExternalStore } from "react";
import { formatIstanbulDate } from "@/lib/format/date";

/** Client-only date label to avoid SSR/client locale hydration mismatch. */
export function IstanbulDateLabel({ className }: { className?: string }) {
  const label = useSyncExternalStore(
    () => () => {},
    () => formatIstanbulDate(new Date()),
    () => "",
  );

  return (
    <p className={className} suppressHydrationWarning>
      {label || "\u00a0"}
    </p>
  );
}
