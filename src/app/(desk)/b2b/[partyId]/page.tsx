import { Suspense } from "react";
import { notFound } from "next/navigation";
import { B2bPartyDetailPanel } from "@/components/desk/b2b-forms";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { requireDeskSession } from "@/lib/auth/get-membership";
import {
  getExternalParty,
  listB2bEntriesForParty,
  listPartyBalances,
} from "@/lib/data/b2b";

export default function B2bPartyPage({
  params,
}: {
  params: Promise<{ partyId: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Yükleniyor…</p>}>
      <B2bPartyBody params={params} />
    </Suspense>
  );
}

async function B2bPartyBody({
  params,
}: {
  params: Promise<{ partyId: string }>;
}) {
  const ctx = await requireDeskSession();
  const { partyId } = await params;
  const [partyRes, entriesRes, balancesRes] = await Promise.all([
    getExternalParty(ctx.workspace.id, partyId),
    listB2bEntriesForParty(ctx.workspace.id, partyId),
    listPartyBalances(ctx.workspace.id),
  ]);

  if (partyRes.schemaMissing || entriesRes.schemaMissing) {
    return <SchemaHintBanner missing />;
  }
  if (!partyRes.row) notFound();

  const balance =
    balancesRes.rows.find((row) => row.partyId === partyId) ?? null;
  const pending = entriesRes.rows.filter((e) => e.status === "pending");
  const confirmed = entriesRes.rows.filter((e) => e.status === "confirmed");
  const rejected = entriesRes.rows.filter((e) => e.status === "rejected");

  return (
    <B2bPartyDetailPanel
      party={partyRes.row}
      balance={balance}
      pending={pending}
      confirmed={confirmed}
      rejected={rejected}
      isOwner={ctx.membership.role === "owner"}
      balancesSchemaMissing={balancesRes.schemaMissing}
    />
  );
}
