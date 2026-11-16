import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import { B2bIndexPanel } from "@/components/desk/b2b-forms";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { requireDeskSession } from "@/lib/auth/get-membership";
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

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Taşeron / cari</h1>
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
