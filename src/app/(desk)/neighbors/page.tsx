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
import { tradeKindLabel } from "@/lib/trade/kinds";

export default async function NeighborsPage() {
  const ctx = await requireDeskSession();
  const [directory, network, requests, balances] = await Promise.all([
    listDirectory(ctx.workspace.id),
    listNetworkShops(),
    listNeighborRequests(ctx.workspace.id),
    listPartyBalances(ctx.workspace.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Komşular"
        description="Rehber, SanayiDesk ağı, plaka sor, stok transfer ve cari — tek yer."
      />

      <section className="flex flex-col gap-3">
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

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">
          SanayiDesk’te kayıtlılar
        </h2>
        {network.schemaMissing ? (
          <SchemaHintBanner missing quietProd />
        ) : network.rows.filter((s) => !s.isMine).length === 0 ? (
          <p className="text-sm text-neutral-500">
            Ağda görünür başka dükkan yok. Ayarlardan “Ağda görün” açabilirsin.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white text-sm">
            {network.rows
              .filter((s) => !s.isMine)
              .map((s) => (
                <li key={s.id} className="px-4 py-2.5">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-neutral-400">
                    {s.slug}
                    {s.phone ? ` · ${s.phone}` : null}
                  </p>
                </li>
              ))}
          </ul>
        )}
        <NeighborInAppAskForm shops={network.rows} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">Plaka sor</h2>
        <SharedPlatePanel />
      </section>

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
            Taşeron / cari
          </Link>
          <Link
            href="/directory"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 font-medium underline-offset-4 hover:underline"
          >
            Rehberi düzenle
          </Link>
          <Link
            href="/network"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 font-medium underline-offset-4 hover:underline"
          >
            Ağ listesi
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
