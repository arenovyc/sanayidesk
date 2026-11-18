"use client";

import { useActionState, useEffect } from "react";
import {
  neighborInAppAskAction,
  neighborRespondAction,
  neighborWaAskAction,
  type NeighborsActionState,
} from "@/app/(desk)/neighbors-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DirectoryContact } from "@/lib/data/ops";
import type { NeighborRequestRow } from "@/lib/data/neighbors";
import type { NetworkShop } from "@/lib/data/network";

const initial: NeighborsActionState = { error: null };

export function NeighborWaAskForm({
  directory,
}: {
  directory: DirectoryContact[];
}) {
  const [state, action, pending] = useActionState(neighborWaAskAction, initial);

  useEffect(() => {
    if (state.waUrl) {
      window.open(state.waUrl, "_blank", "noopener,noreferrer");
    }
  }, [state.waUrl]);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-sm font-medium">Rehberden WhatsApp ile sor</p>
      <p className="text-xs text-neutral-500">
        Sistemde olmayan komşu için: mesaj açılır, gölge cari oluşur.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dirPick">Rehberden seç (opsiyonel)</Label>
        <select
          id="dirPick"
          className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm"
          onChange={(e) => {
            const id = e.target.value;
            const row = directory.find((d) => d.id === id);
            if (!row) return;
            const name = document.getElementById("name") as HTMLInputElement | null;
            const phone = document.getElementById("phone") as HTMLInputElement | null;
            if (name) name.value = row.name;
            if (phone) phone.value = row.phone;
          }}
          defaultValue=""
        >
          <option value="">— Yeni veya seç —</option>
          {directory.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">İsim</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Telefon</Label>
          <Input id="phone" name="phone" required inputMode="tel" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="kind">Tür</Label>
        <select
          id="kind"
          name="kind"
          className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm"
          defaultValue="parca_sorusu"
        >
          <option value="parca_sorusu">Parça / stok sor</option>
          <option value="is_paslama">İş pasla</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="askText">Mesaj</Label>
        <Input
          id="askText"
          name="askText"
          required
          placeholder="Egea ön balata var mı, fiyat?"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.waUrl ? (
        <p className="text-sm text-emerald-700">
          WhatsApp açıldı.{" "}
          <a href={state.waUrl} className="underline" target="_blank" rel="noreferrer">
            Tekrar aç
          </a>
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "…" : "WhatsApp + gölge cari"}
      </Button>
    </form>
  );
}

export function NeighborInAppAskForm({ shops }: { shops: NetworkShop[] }) {
  const [state, action, pending] = useActionState(neighborInAppAskAction, initial);
  const others = shops.filter((s) => !s.isMine);

  if (others.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
        Ağda henüz başka SanayiDesk dükkanı yok. Rehber + WhatsApp kullan.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-sm font-medium">Kayıtlı dükkana talep kartı</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="toWorkspaceId">Dükkan</Label>
        <select
          id="toWorkspaceId"
          name="toWorkspaceId"
          required
          className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm"
          defaultValue=""
        >
          <option value="" disabled>
            Seç
          </option>
          {others.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="kind2">Tür</Label>
        <select
          id="kind2"
          name="kind"
          className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm"
          defaultValue="parca_sorusu"
        >
          <option value="parca_sorusu">Parça sorusu</option>
          <option value="is_paslama">İş paslama</option>
          <option value="stok_transfer_istegi">Stok transfer isteği</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="askText2">Mesaj</Label>
        <Input id="askText2" name="askText" required />
      </div>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "…" : "Talep gönder"}
      </Button>
    </form>
  );
}

export function NeighborInbox({ rows }: { rows: NeighborRequestRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-neutral-400">Gelen talep yok.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li
          key={row.id}
          className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
        >
          <p className="font-medium">{row.kind.replaceAll("_", " ")}</p>
          <p className="mt-1 text-neutral-600">
            {typeof row.payload.text === "string" ? row.payload.text : "—"}
          </p>
          <p className="mt-1 text-xs text-neutral-400">{row.status}</p>
          {row.status === "open" ? (
            <NeighborRespondButtons id={row.id} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function NeighborRespondButtons({ id }: { id: string }) {
  const [state, action, pending] = useActionState(neighborRespondAction, initial);
  return (
    <form action={action} className="mt-2 flex gap-2">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" name="status" value="accepted" size="sm" disabled={pending}>
        Kabul
      </Button>
      <Button
        type="submit"
        name="status"
        value="rejected"
        size="sm"
        variant="outline"
        disabled={pending}
      >
        Red
      </Button>
      {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
    </form>
  );
}
