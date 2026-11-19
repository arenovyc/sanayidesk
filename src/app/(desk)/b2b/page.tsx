import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import { B2bIndexPanel } from "@/components/desk/b2b-forms";
import { PageHeader } from "@/components/shells/page-header";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { getTradeProfile } from "@/lib/trade/profile";
import {
  listB2bEntries,
  listExternalParties,
  listPartyBalances,
} from "@/lib/data/b2b";
import { listNetworkShops } from "@/lib/data/network";
import { listDirectory } from "@/lib/data/ops";

export default function B2bPage() {
  return (
    <Suspense fallback={null}>
      <B2bBody />
    </Suspense>
  );
}

async function B2bBody() {
  const ctx = await requireDeskSession();
  const [partiesRes, entriesRes, balancesRes, directory, network] =
    await Promise.all([
      listExternalParties(ctx.workspace.id),
      listB2bEntries(ctx.workspace.id),
      listPartyBalances(ctx.workspace.id),
      listDirectory(ctx.workspace.id),
      listNetworkShops(),
    ]);

  const schemaMissing = partiesRes.schemaMissing || entriesRes.schemaMissing;

  const profile = getTradeProfile(ctx.workspace.tradeKind);
  const backHref = profile.nav.some((n) => n.href === "/b2b")
    ? "/today"
    : "/more";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={
          profile.family === "counter" ? "Veresiye / cari" : "Taşeron / cari"
        }
        backHref={backHref}
        backLabel={backHref === "/today" ? "Bugün" : "Daha fazla"}
      />
      {schemaMissing ? (
        <SchemaHintBanner missing />
      ) : (
        <B2bIndexPanel
          balances={balancesRes.rows}
          parties={partiesRes.rows}
          pendingEntries={entriesRes.rows.filter((e) => e.status === "pending")}
          directory={directory}
          networkShops={network.rows}
          isOwner={ctx.membership.role === "owner"}
          balancesSchemaMissing={balancesRes.schemaMissing}
        />
      )}
    </div>
  );
}
