import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import { InventoryPanel } from "@/components/desk/inventory-forms";
import { PageHeader } from "@/components/shells/page-header";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { getTradeProfile } from "@/lib/trade/profile";
import {
  listInventoryItems,
  listInventoryMovements,
} from "@/lib/data/inventory";
import { listInventoryTransfers } from "@/lib/data/inventory-transfers";
import { listNetworkShops } from "@/lib/data/network";

export default function InventoryPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <InventoryBody />
    </Suspense>
  );
}

async function InventoryBody() {
  const ctx = await requireDeskSession();
  const [items, moves, transfers, network] = await Promise.all([
    listInventoryItems(ctx.workspace.id),
    listInventoryMovements(ctx.workspace.id),
    listInventoryTransfers(ctx.workspace.id),
    listNetworkShops(),
  ]);

  const profile = getTradeProfile(ctx.workspace.tradeKind);
  const backHref =
    profile.nav.some((n) => n.href === "/inventory") ? "/today" : "/more";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Stok"
        backHref={backHref}
        backLabel={backHref === "/today" ? "Bugün" : "Daha fazla"}
        description="Envanter, düşük stok çanı ve dükkanlar arası transfer."
      />
      {items.schemaMissing || moves.schemaMissing ? (
        <SchemaHintBanner missing />
      ) : (
        <InventoryPanel
          items={items.rows}
          movements={moves.rows}
          transfers={transfers.schemaMissing ? [] : transfers.rows}
          networkShops={network.schemaMissing ? [] : network.rows}
          workspaceId={ctx.workspace.id}
        />
      )}
    </div>
  );
}
