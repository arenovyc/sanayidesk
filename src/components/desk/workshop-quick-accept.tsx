"use client";

import { useRouter } from "next/navigation";
import { QuickPresets } from "@/components/desk/quick-presets";
import { QUICK_PRESETS, type TradeKind } from "@/lib/trade/kinds";

/** Hızlı etiket → /jobs/new?complaint=… */
export function WorkshopQuickAccept({ tradeKind }: { tradeKind: TradeKind }) {
  const router = useRouter();
  const presets = QUICK_PRESETS[tradeKind];

  return (
    <QuickPresets
      presets={presets}
      onPick={(text) => {
        router.push(`/jobs/new?complaint=${encodeURIComponent(text)}`);
      }}
    />
  );
}
