"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { OnboardingStep } from "@/lib/trade/profile";

const KEY = "sd_onboarding_done";

export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setDone(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  if (!ready) return null;
  const remaining = steps.filter((s) => !done[s.id]);
  if (remaining.length === 0) return null;

  function mark(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: true };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
      <p className="text-sm font-medium text-neutral-950">İlk adımlar</p>
      <ul className="mt-2 flex flex-col gap-2">
        {remaining.map((step) => (
          <li
            key={step.id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <Link
              href={step.href}
              className="font-medium text-neutral-800 underline-offset-4 hover:underline"
            >
              {step.label}
            </Link>
            <button
              type="button"
              onClick={() => mark(step.id)}
              className="shrink-0 rounded-lg px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
            >
              Tamam
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
