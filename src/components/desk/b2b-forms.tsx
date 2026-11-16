"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  addExternalPartyAction,
  confirmB2bEntryAction,
  createB2bEntryAction,
  rejectB2bEntryAction,
  type B2bActionState,
} from "@/app/(desk)/b2b-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { netBalanceLabel } from "@/lib/b2b/balance";
import { formatMoney } from "@/lib/format/money";
import type {
  B2bEntryRow,
  ExternalPartyRow,
  PartyBalanceRow,
} from "@/lib/data/b2b";
import type { DirectoryContact } from "@/lib/data/ops";

const initial: B2bActionState = { error: null };

const DIRECTION_LABELS = {
  we_owe: "Biz borçluyuz",
  they_owe: "Onlar borçlu",
} as const;

const STATUS_LABELS = {
  pending: "Bekliyor",
  confirmed: "Onaylı",
  rejected: "Red",
} as const;

function EntryActions({
  entry,
  isOwner,
  returnTo,
}: {
  entry: B2bEntryRow;
  isOwner: boolean;
  returnTo: string;
}) {
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmB2bEntryAction,
    initial,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectB2bEntryAction,
    initial,
  );

  if (!isOwner || entry.status !== "pending") return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <form action={confirmAction}>
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button type="submit" size="sm" disabled={confirmPending}>
            Onayla
          </Button>
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button type="submit" size="sm" variant="outline" disabled={rejectPending}>
            Reddet
          </Button>
        </form>
      </div>
      {confirmState.error || rejectState.error ? (
        <p className="text-sm text-red-700">
          {confirmState.error ?? rejectState.error}
        </p>
      ) : null}
    </div>
  );
}

function EntryList({
  entries,
  isOwner,
  returnTo,
  empty,
  muted,
}: {
  entries: B2bEntryRow[];
  isOwner: boolean;
  returnTo: string;
  empty: string;
  muted?: boolean;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-neutral-400">{empty}</p>;
  }

  return (
    <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className={`flex flex-col gap-2 px-4 py-3 text-sm ${muted ? "opacity-60" : ""}`}
        >
          <div className="flex justify-between gap-2">
            <div>
              <p className="font-medium">{entry.partyName}</p>
              <p className="text-neutral-500">
                {DIRECTION_LABELS[entry.direction]} · {STATUS_LABELS[entry.status]}
              </p>
              {entry.workOrderId ? (
                <Link
                  href={`/jobs/${entry.workOrderId}`}
                  className="text-xs text-neutral-500 underline-offset-2 hover:underline"
                >
                  İşe bağlı
                </Link>
              ) : null}
            </div>
            <p className="font-semibold">{formatMoney(entry.amount)}</p>
          </div>
          <EntryActions entry={entry} isOwner={isOwner} returnTo={returnTo} />
        </li>
      ))}
    </ul>
  );
}

export function B2bCreateEntryForm({
  parties,
  returnTo,
  workOrderId,
  defaultPartyId,
}: {
  parties: ExternalPartyRow[];
  returnTo: string;
  workOrderId?: string;
  defaultPartyId?: string;
}) {
  const [entryState, entryAction, entryPending] = useActionState(
    createB2bEntryAction,
    initial,
  );

  return (
    <form
      action={entryAction}
      className="grid gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
    >
      <input type="hidden" name="returnTo" value={returnTo} />
      {workOrderId ? (
        <input type="hidden" name="workOrderId" value={workOrderId} />
      ) : null}
      <Label htmlFor="externalPartyId">Taşeron</Label>
      <select
        id="externalPartyId"
        name="externalPartyId"
        required
        defaultValue={defaultPartyId ?? ""}
        className="h-11 rounded-lg border border-neutral-200 bg-white px-3"
        disabled={parties.length === 0}
      >
        {parties.length === 0 ? (
          <option value="">Önce taşeron ekle</option>
        ) : (
          parties.map((party) => (
            <option key={party.id} value={party.id}>
              {party.name}
            </option>
          ))
        )}
      </select>
      <Label htmlFor="amount">Tutar</Label>
      <Input id="amount" name="amount" inputMode="decimal" required />
      <Label htmlFor="direction">Yön</Label>
      <select
        id="direction"
        name="direction"
        defaultValue="we_owe"
        className="h-11 rounded-lg border border-neutral-200 bg-white px-3"
      >
        <option value="we_owe">Biz borçluyuz</option>
        <option value="they_owe">Onlar borçlu</option>
      </select>
      <Label htmlFor="entry-note">Not</Label>
      <Input id="entry-note" name="note" />
      <Button type="submit" disabled={entryPending || parties.length === 0}>
        Bekleyen kayıt oluştur
      </Button>
      {entryState.error ? (
        <p className="text-sm text-red-700">{entryState.error}</p>
      ) : null}
    </form>
  );
}

export function B2bAddPartyForm({
  directory,
  networkShops = [],
}: {
  directory: DirectoryContact[];
  networkShops?: { id: string; name: string; isMine?: boolean }[];
}) {
  const [partyState, partyAction, partyPending] = useActionState(
    addExternalPartyAction,
    initial,
  );

  const linkable = networkShops.filter((shop) => !shop.isMine);

  return (
    <form
      action={partyAction}
      className="grid gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
    >
      <input type="hidden" name="returnTo" value="/b2b" />
      <Label htmlFor="name">Ad</Label>
      <Input id="name" name="name" required />
      <Label htmlFor="phone">Telefon</Label>
      <Input id="phone" name="phone" inputMode="tel" />
      <Label htmlFor="note">Not</Label>
      <Input id="note" name="note" />
      <Label htmlFor="linkedDirectoryId">Rehbere bağla</Label>
      <select
        id="linkedDirectoryId"
        name="linkedDirectoryId"
        className="h-11 rounded-lg border border-neutral-200 bg-white px-3"
        defaultValue=""
      >
        <option value="">Yok</option>
        {directory.map((contact) => (
          <option key={contact.id} value={contact.id}>
            {contact.name}
          </option>
        ))}
      </select>
      {linkable.length > 0 ? (
        <>
          <Label htmlFor="linkedWorkspaceId">Ağ dükkanı bağla</Label>
          <select
            id="linkedWorkspaceId"
            name="linkedWorkspaceId"
            className="h-11 rounded-lg border border-neutral-200 bg-white px-3"
            defaultValue=""
          >
            <option value="">Yok</option>
            {linkable.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
        </>
      ) : null}
      <Button type="submit" disabled={partyPending}>
        Taşeron ekle
      </Button>
      {partyState.error ? (
        <p className="text-sm text-red-700">{partyState.error}</p>
      ) : null}
    </form>
  );
}

export function B2bIndexPanel({
  balances,
  parties,
  pendingEntries,
  directory,
  networkShops = [],
  isOwner,
  balancesSchemaMissing,
}: {
  balances: PartyBalanceRow[];
  parties: ExternalPartyRow[];
  pendingEntries: B2bEntryRow[];
  directory: DirectoryContact[];
  networkShops?: { id: string; name: string; isMine?: boolean }[];
  isOwner: boolean;
  balancesSchemaMissing: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">Taşeron bakiyeleri</h2>
        {balancesSchemaMissing ? (
          <SchemaHintBanner missing />
        ) : parties.length === 0 ? (
          <p className="text-sm text-neutral-400">Taşeron yok.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {parties.map((party) => {
              const balance = balances.find((row) => row.partyId === party.id);
              const net = balance?.net ?? 0;
              return (
                <li key={party.id}>
                  <Link
                    href={`/b2b/${party.id}`}
                    className="flex items-center justify-between gap-2 px-4 py-3.5 text-sm"
                  >
                    <span>
                      <span className="font-medium">{party.name}</span>
                      <span className="mt-0.5 block text-neutral-500">
                        {netBalanceLabel(net)}
                        {party.linkedWorkspaceId ? " · ağ bağlı" : ""}
                      </span>
                    </span>
                    <span className="font-semibold">{formatMoney(Math.abs(net))}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-neutral-500">Bekleyen onaylar</h2>
          {pendingEntries.length > 0 ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
              {pendingEntries.length}
            </span>
          ) : null}
        </div>
        <EntryList
          entries={pendingEntries}
          isOwner={isOwner}
          returnTo="/b2b"
          empty="Bekleyen kayıt yok."
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">Yeni cari</h2>
        <B2bCreateEntryForm parties={parties} returnTo="/b2b" />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">Taşeron ekle</h2>
        <B2bAddPartyForm directory={directory} networkShops={networkShops} />
      </section>
    </div>
  );
}

export function B2bPartyDetailPanel({
  party,
  balance,
  pending,
  confirmed,
  rejected,
  isOwner,
  balancesSchemaMissing,
}: {
  party: ExternalPartyRow;
  balance: PartyBalanceRow | null;
  pending: B2bEntryRow[];
  confirmed: B2bEntryRow[];
  rejected: B2bEntryRow[];
  isOwner: boolean;
  balancesSchemaMissing: boolean;
}) {
  const net = balance?.net ?? 0;
  const returnTo = `/b2b/${party.id}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-neutral-500">
          <Link href="/b2b" className="hover:underline">
            Taşeron / cari
          </Link>
        </p>
        <h1 className="mt-1 text-xl font-semibold">{party.name}</h1>
        {party.phone ? (
          <p className="mt-1 text-sm text-neutral-500">{party.phone}</p>
        ) : null}
        {balancesSchemaMissing ? (
          <div className="mt-2">
            <SchemaHintBanner missing />
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-600">
            {netBalanceLabel(net)} · {formatMoney(Math.abs(net))}
          </p>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-neutral-500">Bekleyen</h2>
          {pending.length > 0 ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
              {pending.length}
            </span>
          ) : null}
        </div>
        <EntryList
          entries={pending}
          isOwner={isOwner}
          returnTo={returnTo}
          empty="Bekleyen yok."
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">Onaylı</h2>
        <EntryList
          entries={confirmed}
          isOwner={false}
          returnTo={returnTo}
          empty="Onaylı kayıt yok."
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">Reddedilen</h2>
        <EntryList
          entries={rejected}
          isOwner={false}
          returnTo={returnTo}
          empty="Red yok."
          muted
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">Yeni cari</h2>
        <B2bCreateEntryForm
          parties={[party]}
          returnTo={returnTo}
          defaultPartyId={party.id}
        />
      </section>
    </div>
  );
}

export function JobB2bPanel({
  workOrderId,
  parties,
  entries,
  isOwner,
  schemaMissing,
}: {
  workOrderId: string;
  parties: ExternalPartyRow[];
  entries: B2bEntryRow[];
  isOwner: boolean;
  schemaMissing: boolean;
}) {
  if (schemaMissing) {
    return <SchemaHintBanner missing />;
  }

  const returnTo = `/jobs/${workOrderId}`;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-neutral-500">Taşeron cari (bu iş)</h2>
      <EntryList
        entries={entries}
        isOwner={isOwner}
        returnTo={returnTo}
        empty="Bu işe bağlı cari yok."
      />
      <B2bCreateEntryForm
        parties={parties}
        returnTo={returnTo}
        workOrderId={workOrderId}
      />
    </section>
  );
}
