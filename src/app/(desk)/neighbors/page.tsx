import Link from "next/link";
import { NeighborInbox, NeighborInAppAskForm, NeighborWaAskForm } from "@/components/desk/neighbors-forms";
import { SharedPlatePanel } from "@/components/desk/shared-plate-panel";
import { PageHeader } from "@/components/shells/page-header";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listPartyBalances } from "@/lib/data/b2b";
import { listNetworkShops } from "@/lib/data/network";
import { listNeighborRequests } from "@/lib/data/neighbors";
import { listDirectory } from "@/lib/data/ops";
import {
  TRADE_KINDS,
  TRADE_KIND_LABELS,
  isTradeKind,
  tradeKindLabel,
} from "@/lib/trade/kinds";
import { getTradeProfile } from "@/lib/trade/profile";

export default async function NeighborsPage({
  searchParams,
}: {
  searchParams: Promise<{ tur?: string }>;
}) {
  const ctx = await requireDeskSession();
  const query = await searchParams;
  const filterKind =
    query.tur && isTradeKind(query.tur) ? query.tur : null;
  const profile = getTradeProfile(ctx.workspace.tradeKind);

  const [directory, network, requests, balances] = await Promise.all([
    listDirectory(ctx.workspace.id),
    listNetworkShops(),
    listNeighborRequests(ctx.workspace.id),
    listPartyBalances(ctx.workspace.id),
  ]);

  const shops = network.rows
    .filter((s) => !s.isMine)
    .filter((s) => (filterKind ? s.tradeKind === filterKind : true))
    .sort((a, b) => {
      const aComp = profile.complementaryTrades.includes(
        a.tradeKind as (typeof TRADE_KINDS)[number],
      )
        ? 0
        : 1;
      const bComp = profile.complementaryTrades.includes(
        b.tradeKind as (typeof TRADE_KINDS)[number],
      )
        ? 0
        : 1;
      if (aComp !== bComp) return aComp - bComp;
      return a.name.localeCompare(b.name, "tr");
    });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Komşular"
        description="Rehber, SanayiDesk ağı, plaka sor, stok transfer ve cari — tek yer."
      />

      <section id="rehber" className="flex flex-col gap-3 scroll-mt-24">
        <h2 className="text-sm font-medium text-neutral-500">Rehberim</h2>
        {directory.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Henüz rehber boş.{" "}
            <Link href="/directory" className="font-medium underline-offset-4 hover:underline">
              Kişi ekle
            </Link>{" "}
            veya aşağıdan WhatsApp ile sor — gölge cari açılır.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white text-sm">
            {directory.slice(0, 8).map((c) => (
              <li key={c.id} className="flex justify-between px-4 py-2.5">
                <span>{c.name}</span>
                <span className="text-neutral-400">{c.phone || "—"}</span>
              </li>
            ))}
          </ul>
        )}
        <NeighborWaAskForm directory={directory} />
      </section>

      <section id="ag" className="flex flex-col gap-3 scroll-mt-24">
        <h2 className="text-sm font-medium text-neutral-500">
          SanayiDesk’te kayıtlılar
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/neighbors"
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              !filterKind
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-700"
            }`}
          >
            Tümü
          </Link>
          {TRADE_KINDS.map((kind) => (
            <Link
              key={kind}
              href={`/neighbors?tur=${kind}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                filterKind === kind
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-white text-neutral-700"
              }`}
            >
              {TRADE_KIND_LABELS[kind]}
            </Link>
          ))}
        </div>
        {network.schemaMissing ? (
          <SchemaHintBanner missing quietProd />
        ) : shops.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Ağda görünür başka dükkan yok. Ayarlardan “Ağda görün” açabilirsin.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white text-sm">
            {shops.map((s) => (
              <li key={s.id} className="px-4 py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">{s.name}</p>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                    {tradeKindLabel(s.tradeKind)}
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  {s.cityDistrict || s.slug}
                  {s.phone ? ` · ${s.phone}` : null}
                </p>
              </li>
            ))}
          </ul>
        )}
        <NeighborInAppAskForm shops={network.rows} />
      </section>

      {profile.family === "workshop" ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-neutral-500">Plaka sor</h2>
          <SharedPlatePanel />
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-500">Stok & cari</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/inventory"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 font-medium underline-offset-4 hover:underline"
          >
            Stok transferleri
          </Link>
          <Link
            href="/b2b"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 font-medium underline-offset-4 hover:underline"
          >
            Veresiye / cari
          </Link>
          <Link
            href="/directory"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 font-medium underline-offset-4 hover:underline"
          >
            Rehberi düzenle
          </Link>
        </div>
        {!balances.schemaMissing && balances.rows.length > 0 ? (
          <ul className="mt-2 divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white text-sm">
            {balances.rows.slice(0, 5).map((b) => (
              <li key={b.partyId} className="flex justify-between px-4 py-2.5">
                <span>{b.partyName}</span>
                <span className="font-mono text-neutral-500">{b.net}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">Gelen kutusu</h2>
        {requests.schemaMissing ? (
          <SchemaHintBanner missing quietProd />
        ) : (
          <NeighborInbox rows={requests.inbox} />
        )}
        <p className="text-xs text-neutral-400">
          Senin dükkanın: {ctx.workspace.name} · {tradeKindLabel(ctx.workspace.tradeKind)}
        </p>
      </section>
    </div>
  );
}
