"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TRIAL_DAYS } from "@/lib/pricing";
import {
  TRADE_KINDS,
  TRADE_KIND_LABELS,
  type TradeKind,
} from "@/lib/trade/kinds";
import { getTradeProfile } from "@/lib/trade/profile";

export function TradePicker() {
  const [kind, setKind] = useState<TradeKind>("tamir");
  const profile = getTradeProfile(kind);

  return (
    <section className="mt-16 scroll-mt-24 border-t border-white/10 pt-12">
      <h2 className="text-center text-xl font-semibold text-white">
        Hangi işi yapıyorsun?
      </h2>
      <p className="mx-auto mt-2 max-w-md text-center text-sm text-zinc-500">
        Türünü seç — ekran ve adımlar sana göre.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {TRADE_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={
              kind === k
                ? "rounded-full border border-amber-400 bg-amber-500 px-3 py-1.5 text-xs font-medium text-zinc-950"
                : "rounded-full border border-white/15 bg-transparent px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-white/30"
            }
          >
            {TRADE_KIND_LABELS[k]}
          </button>
        ))}
      </div>
      <ol className="mx-auto mt-8 grid max-w-3xl gap-3 md:grid-cols-3">
        {profile.landingSteps.map((step, i) => (
          <li
            key={step.title}
            className="rounded-2xl border border-white/10 bg-[#111827]/60 p-4"
          >
            <p className="font-mono text-sm text-amber-400">
              {String(i + 1).padStart(2, "0")}
            </p>
            <p className="mt-2 text-sm font-medium text-white">{step.title}</p>
            <p className="mt-1 text-sm leading-6 text-zinc-400">{step.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button
          asChild
          size="lg"
          className="bg-amber-500 text-zinc-950 hover:bg-amber-400"
        >
          <Link href={`/register/fresh?tur=${kind}`}>
            {TRIAL_DAYS} Gün — {profile.shortLabel}
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="border-white/15 bg-transparent text-zinc-100 hover:bg-white/5"
        >
          <Link href={`/demo?tur=${kind}`}>Bu türün demosu</Link>
        </Button>
      </div>
    </section>
  );
}
