"use client";

import { useState, useTransition } from "react";
import { lookupSharedPlateAction } from "@/app/(desk)/network-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import type { SharedPlateSummary } from "@/lib/data/network";
import { STATUS_LABELS } from "@/lib/work-orders/status";
import type { WorkOrderStatus } from "@/lib/work-orders/status";

export function SharedPlatePanel({ defaultPlate = "" }: { defaultPlate?: string }) {
  const [plate, setPlate] = useState(defaultPlate);
  const [rows, setRows] = useState<SharedPlateSummary[] | null>(null);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
      <h2 className="font-medium">Diğer dükkanlar (plaka)</h2>
      <p className="text-xs text-neutral-500">
        Yalnız paylaşımı açık dükkanlardan özet. Para ve detay yok.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sharedPlate">Plaka</Label>
        <Input
          id="sharedPlate"
          value={plate}
          onChange={(e) => setPlate(e.target.value)}
          className="font-mono uppercase tracking-wider"
        />
      </div>
      <Button
        type="button"
        disabled={pending || plate.trim().length < 3}
        onClick={() => {
          start(async () => {
            const result = await lookupSharedPlateAction(plate);
            setSchemaMissing(result.schemaMissing);
            setError(result.error);
            setRows(result.rows);
          });
        }}
      >
        {pending ? "…" : "Sorgula"}
      </Button>
      {schemaMissing ? <SchemaHintBanner missing /> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {rows && !schemaMissing ? (
        rows.length === 0 ? (
          <p className="text-sm text-neutral-400">Paylaşılan kayıt yok.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-100">
            {rows.map((row) => (
              <li key={row.workspaceId} className="px-3 py-2 text-sm">
                <p className="font-medium">{row.workspaceName}</p>
                <p className="text-xs text-neutral-500">
                  {row.jobCount} iş
                  {row.lastStatus
                    ? ` · son: ${
                        STATUS_LABELS[row.lastStatus as WorkOrderStatus] ??
                        row.lastStatus
                      }`
                    : ""}
                  {row.lastAt
                    ? ` · ${new Date(row.lastAt).toLocaleDateString("tr-TR", {
                        timeZone: "Europe/Istanbul",
                      })}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}
