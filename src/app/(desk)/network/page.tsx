import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Network } from "lucide-react";
import { PageHeader } from "@/components/shells/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SchemaHintBanner } from "@/components/ui/schema-hint-banner";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { listNetworkShops } from "@/lib/data/network";

export default function NetworkPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NetworkBody />
    </Suspense>
  );
}

async function NetworkBody() {
  await requireDeskSession();
  const shops = await listNetworkShops();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Sanayi ağı"
        backHref="/more"
        backLabel="Daha fazla"
        description={
          <>
            Ağda görünür dükkanlar. Yerel parçacılar için{" "}
            <Link href="/directory" className="underline-offset-4 hover:underline">
              rehber
            </Link>
            .
          </>
        }
      />
      {shops.schemaMissing ? (
        <SchemaHintBanner missing quietProd />
      ) : shops.rows.length === 0 ? (
        <EmptyState
          icon={Network}
          title="Henüz görünür dükkan yok"
          description="Ayarlardan “Ağda görün” açınca burada listelenirsin."
          actionHref="/settings"
          actionLabel="Ayarlara git"
        />
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {shops.rows.map((shop) => (
            <li key={shop.id} className="px-4 py-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium">
                  {shop.name}
                  {shop.isMine ? (
                    <span className="ml-2 text-xs font-normal text-neutral-400">
                      (benim)
                    </span>
                  ) : null}
                </span>
                <span className="font-mono text-xs text-neutral-400">
                  {shop.slug}
                </span>
              </div>
              {shop.phone || shop.address ? (
                <p className="mt-1 text-xs text-neutral-500">
                  {[shop.phone, shop.address].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
