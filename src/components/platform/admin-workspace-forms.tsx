"use client";

import { useActionState } from "react";
import {
  updateWorkspaceAdminAction,
  type AdminActionState,
} from "@/app/(platform)/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminWorkspaceRow } from "@/lib/data/admin-workspaces";

const initial: AdminActionState = { error: null };

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function WorkspaceAdminCard({ row }: { row: AdminWorkspaceRow }) {
  const [state, action, pending] = useActionState(
    updateWorkspaceAdminAction,
    initial,
  );

  return (
    <li className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="font-mono text-xs text-neutral-400">{row.slug}</p>
        </div>
        {row.isSuspended ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
            Askıda
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
            Aktif
          </span>
        )}
      </div>
      <form action={action} className="grid gap-2">
        <input type="hidden" name="workspaceId" value={row.id} />
        <Label htmlFor={`plan-${row.id}`}>Plan</Label>
        <Input id={`plan-${row.id}`} name="plan" defaultValue={row.plan} />
        <Label htmlFor={`trial-${row.id}`}>Deneme bitiş</Label>
        <Input
          id={`trial-${row.id}`}
          name="trialEndsAt"
          type="datetime-local"
          defaultValue={toLocalInput(row.trialEndsAt)}
        />
        <Label htmlFor={`susp-${row.id}`}>Askı</Label>
        <select
          id={`susp-${row.id}`}
          name="isSuspended"
          defaultValue={row.isSuspended ? "true" : "false"}
          className="h-11 rounded-lg border border-neutral-200 bg-white px-3"
        >
          <option value="false">Aktif</option>
          <option value="true">Askıda</option>
        </select>
        <Button type="submit" size="sm" disabled={pending}>
          Kaydet
        </Button>
        {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      </form>
    </li>
  );
}

export function AdminWorkspaceList({ rows }: { rows: AdminWorkspaceRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-neutral-400">Workspace yok.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <WorkspaceAdminCard key={row.id} row={row} />
      ))}
    </ul>
  );
}
