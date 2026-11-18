"use client";

import type { QuickPreset } from "@/lib/trade/kinds";

export function QuickPresets({
  presets,
  onPick,
  name = "preset",
}: {
  presets: QuickPreset[];
  onPick?: (text: string) => void;
  name?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Hızlı işlem">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          name={name}
          onClick={() => onPick?.(preset.text)}
          className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-400"
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
