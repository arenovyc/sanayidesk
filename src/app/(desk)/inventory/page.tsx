import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { InventoryPanel } from "@/components/desk/inventory-forms";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { requireDeskSession } from "@/lib/auth/get-membership";
import {
  listInventoryItems,
  listInventoryMovements,
} from "@/lib/data/inventory";
import { listInventoryTransfers } from "@/lib/data/inventory-transfers";
import { listNetworkShops } from "@/lib/data/network";

export default function InventoryPage() {
  return (
    <Suspense fallback={null}>
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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-neutral-500">
          <Link href="/more" className="hover:underline">
            Daha fazla
          </Link>
        </p>
        <h1 className="mt-1 text-xl font-semibold">Stok</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Envanter, düşük stok çanı ve dükkanlar arası transfer.
        </p>
      </div>
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
