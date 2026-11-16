"use client";

import { useActionState } from "react";
import {
  updateLeadStatusAction,
  type AdminLeadActionState,
} from "@/app/(platform)/admin-lead-actions";
import { Button } from "@/components/ui/button";
import type { LeadRow } from "@/lib/data/leads";

const initial: AdminLeadActionState = { error: null };

const STATUS_LABEL = {
  new: "Yeni",
  contacted: "Dönüldü",
  closed: "Kapalı",
} as const;

function LeadStatusForm({ lead }: { lead: LeadRow }) {
  const [state, action, pending] = useActionState(
    updateLeadStatusAction,
    initial,
  );

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="leadId" value={lead.id} />
      <select
        name="status"
        defaultValue={lead.status}
        className="h-9 rounded-lg border border-neutral-200 bg-white px-2 text-sm"
      >
        <option value="new">Yeni</option>
        <option value="contacted">Dönüldü</option>
        <option value="closed">Kapalı</option>
      </select>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        Kaydet
      </Button>
      {state.error ? (
        <span className="w-full text-xs text-red-700">{state.error}</span>
      ) : null}
    </form>
  );
}

export function AdminLeadsList({
  rows,
  schemaMissing,
  error,
}: {
  rows: LeadRow[];
  schemaMissing: boolean;
  error: string | null;
}) {
  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }
  if (schemaMissing) {
    return (
      <p className="text-sm text-amber-800">
        Başvuru tablosu yok. Proje kökünde npm run db:push (011).
      </p>
    );
  }
  if (rows.length === 0) {
    return <p className="text-sm text-neutral-400">Başvuru yok.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((lead) => (
        <li
          key={lead.id}
          className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{lead.shopName}</p>
              <p className="text-neutral-500">
                {lead.name}
                {lead.city ? ` · ${lead.city}` : ""}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                {lead.email}
                {lead.phone ? ` · ${lead.phone}` : ""}
              </p>
              {lead.note ? (
                <p className="mt-2 text-xs text-neutral-500">{lead.note}</p>
              ) : null}
            </div>
            <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
              {STATUS_LABEL[lead.status]}
            </span>
          </div>
          <div className="mt-3">
            <LeadStatusForm lead={lead} />
          </div>
        </li>
      ))}
    </ul>
  );
}
