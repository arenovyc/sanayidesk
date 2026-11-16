"use client";

import { useActionState } from "react";
import {
  activateWorkspaceAction,
  extendTrial15Action,
  type AdminActionState,
} from "@/app/(platform)/admin-actions";
import { Button } from "@/components/ui/button";
import {
  trialDaysLeft,
  type AdminWorkspaceRow,
} from "@/lib/data/admin-workspace-types";
import { formatIstanbulDate } from "@/lib/format/date";

const initial: AdminActionState = { error: null };

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

function waMeLink(phone: string | null, shopName: string): string | null {
  if (!phone) return null;
  let digits = digitsOnly(phone);
  if (digits.startsWith("0")) digits = `90${digits.slice(1)}`;
  if (digits.length === 10) digits = `90${digits}`;
  if (!digits.startsWith("90") || digits.length < 12) return null;
  const text = encodeURIComponent(
    `Merhaba, SanayiDesk’e hoş geldiniz. ${shopName} dükkanınız hazır — sorularınız olursa buradan yazabilirsiniz.`,
  );
  return `https://wa.me/${digits}?text=${text}`;
}

function WorkspaceAdminCard({ row }: { row: AdminWorkspaceRow }) {
  const [extendState, extendAction, extendPending] = useActionState(
    extendTrial15Action,
    initial,
  );
  const [activateState, activateAction, activatePending] = useActionState(
    activateWorkspaceAction,
    initial,
  );

  const daysLeft = trialDaysLeft(row.trialEndsAt);
  const wa = waMeLink(row.ownerPhone, row.name);
  const error = extendState.error ?? activateState.error;

  return (
    <li className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="font-mono text-xs text-neutral-400">{row.slug}</p>
          {row.cityDistrict ? (
            <p className="mt-1 text-sm text-neutral-600">{row.cityDistrict}</p>
          ) : null}
        </div>
        {row.isSuspended ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
            Askıda
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
            {row.plan === "active" ? "Aktif" : "Deneme"}
          </span>
        )}
      </div>

      <dl className="grid gap-1.5 text-sm text-neutral-700">
        <div className="flex justify-between gap-2">
          <dt className="text-neutral-500">Yetkili</dt>
          <dd className="text-right">{row.ownerName ?? "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-neutral-500">Telefon</dt>
          <dd className="flex items-center gap-2 text-right">
            <span>{row.ownerPhone ?? "—"}</span>
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center rounded-lg bg-emerald-700 px-2.5 text-xs font-medium text-white"
              >
                WhatsApp
              </a>
            ) : null}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-neutral-500">Kayıt</dt>
          <dd>{formatIstanbulDate(new Date(row.createdAt))}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-neutral-500">Kalan deneme</dt>
          <dd>
            {daysLeft === null
              ? "—"
              : daysLeft < 0
                ? `${Math.abs(daysLeft)} gün geçti`
                : `${daysLeft} gün`}
          </dd>
        </div>
        <div className="mt-1 grid grid-cols-3 gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-center text-xs">
          <div>
            <p className="font-semibold text-neutral-950">{row.workOrderCount}</p>
            <p className="text-neutral-500">İş emri</p>
          </div>
          <div>
            <p className="font-semibold text-neutral-950">{row.mechanicCount}</p>
            <p className="text-neutral-500">Usta</p>
          </div>
          <div>
            <p className="font-semibold text-neutral-950">
              {row.lastActivityAt
                ? formatIstanbulDate(new Date(row.lastActivityAt))
                : "—"}
            </p>
            <p className="text-neutral-500">Son işlem</p>
          </div>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap gap-2">
        <form action={extendAction}>
          <input type="hidden" name="workspaceId" value={row.id} />
          <Button type="submit" size="sm" disabled={extendPending}>
            {extendPending ? "…" : "+15 Gün Uzat"}
          </Button>
        </form>
        <form action={activateAction}>
          <input type="hidden" name="workspaceId" value={row.id} />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={activatePending || row.plan === "active"}
          >
            {activatePending ? "…" : "Aktif Yap"}
          </Button>
        </form>
      </div>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
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
