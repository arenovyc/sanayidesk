"use client";

import { useTransition } from "react";
import { setVehicleCheckupAction } from "@/app/(desk)/jobs/checkup-actions";
import type { VehicleCheckup, VehicleCheckupLevel } from "@/lib/work-orders/types";
import { toastError, toastSuccess } from "@/lib/ui/toast";
import { cn } from "@/lib/utils";

const ITEMS: { key: keyof VehicleCheckup; label: string }[] = [
  { key: "brake_pads", label: "Fren Balatası" },
  { key: "tires", label: "Lastikler" },
  { key: "battery", label: "Akü" },
  { key: "wipers", label: "Silecekler" },
  { key: "fluids", label: "Sıvılar" },
  { key: "belts", label: "Kayışlar" },
];

const LEVELS: { value: VehicleCheckupLevel; label: string; className: string }[] =
  [
    { value: "ok", label: "İyi", className: "bg-emerald-600 text-white" },
    { value: "soon", label: "Yakında", className: "bg-amber-500 text-white" },
    { value: "urgent", label: "Acil", className: "bg-red-600 text-white" },
  ];

export function VehicleCheckupPanel({
  workOrderId,
  checkup,
}: {
  workOrderId: string;
  checkup: VehicleCheckup;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <section className="flex flex-col gap-2">
      <div>
        <h2 className="text-sm font-medium text-neutral-500">
          Hızlı araç kontrolü
        </h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          İsteğe bağlı. Yakında / Acil seçilenler müşteri onay linkinde görünür;
          dokununca kaydedilir.
        </p>
      </div>
      <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {ITEMS.map((item) => {
          const current = checkup[item.key];
          return (
            <li
              key={item.key}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
            >
              <span className="text-sm text-neutral-800">{item.label}</span>
              <div className="flex gap-1">
                {LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    disabled={pending}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      current === level.value
                        ? level.className
                        : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
                    )}
                    onClick={() => {
                      const next: VehicleCheckup = {
                        ...checkup,
                        [item.key]: level.value,
                      };
                      startTransition(async () => {
                        const result = await setVehicleCheckupAction(
                          workOrderId,
                          next,
                        );
                        if (result.error) toastError(result.error);
                        else toastSuccess("Kontrol kaydedildi");
                      });
                    }}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
