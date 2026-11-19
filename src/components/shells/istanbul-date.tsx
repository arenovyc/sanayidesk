"use client";

import { useEffect, useState } from "react";
import { formatIstanbulDate } from "@/lib/format/date";

/** Client-only date label — avoids Date in prerender / SSR. */
export function IstanbulDateLabel({ className }: { className?: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(formatIstanbulDate(new Date()));
  }, []);

  return (
    <p className={className} suppressHydrationWarning>
      {label || "\u00a0"}
    </p>
  );
}
