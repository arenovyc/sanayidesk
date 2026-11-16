"use client";

import { useActionState } from "react";
import {
  addMechanicBonusAction,
  type BonusActionState,
} from "@/app/(desk)/bonus-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { formatMoney } from "@/lib/format/money";
import type { BonusRow } from "@/lib/data/bonuses";
import type { TeamMember } from "@/lib/data/ops";

const initial: BonusActionState = { error: null };

export function JobBonusPanel({
  workOrderId,
  mechanics,
  bonuses,
  isOwner,
  schemaMissing,
}: {
  workOrderId: string;
  mechanics: TeamMember[];
  bonuses: BonusRow[];
  isOwner: boolean;
  schemaMissing: boolean;
}) {
  const [state, action, pending] = useActionState(addMechanicBonusAction, initial);

  if (schemaMissing) {
    return <SchemaHintBanner missing />;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-neutral-500">Usta primi</h2>
      {bonuses.length === 0 ? (
        <p className="text-sm text-neutral-400">Bu işe prim yok.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {bonuses.map((row) => (
            <li key={row.id} className="flex justify-between px-3 py-2 text-sm">
              <span>
                {row.mechanicName}
                {row.note ? (
                  <span className="ml-2 text-neutral-400">{row.note}</span>
                ) : null}
              </span>
              <span className="font-medium">{formatMoney(row.amount)}</span>
            </li>
          ))}
        </ul>
      )}
      {isOwner ? (
        <form
          action={action}
          className="grid gap-2 rounded-xl border border-neutral-200 bg-white p-3"
        >
          <input type="hidden" name="workOrderId" value={workOrderId} />
          <Label htmlFor="bonus-mechanic">Usta</Label>
          <select
            id="bonus-mechanic"
            name="membershipId"
            required
            className="h-11 rounded-lg border border-neutral-200 bg-white px-3"
            disabled={mechanics.length === 0}
          >
            {mechanics.length === 0 ? (
              <option value="">Usta yok</option>
            ) : (
              mechanics.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName || "Usta"}
                </option>
              ))
            )}
          </select>
          <Label htmlFor="bonus-amount">Tutar</Label>
          <Input id="bonus-amount" name="amount" inputMode="decimal" required />
          <Label htmlFor="bonus-note">Not</Label>
          <Input id="bonus-note" name="note" />
          <Button type="submit" disabled={pending || mechanics.length === 0}>
            Prim ekle
          </Button>
          {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
        </form>
      ) : null}
    </section>
  );
}
