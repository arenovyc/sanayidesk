import { Suspense } from "react";
import { BottomNav } from "@/components/shells/bottom-nav";
import { TopBar } from "@/components/shells/top-bar";
import { PageSkeleton } from "@/components/ui/skeleton";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { getDeskNotificationCounts } from "@/lib/data/notifications";

function TopBarFallback() {
  return (
    <header className="flex h-[3.75rem] items-center border-b border-neutral-200 bg-white px-4 pt-[max(0.75rem,env(safe-area-inset-top))] print:hidden">
      <div className="h-8 w-8 animate-pulse rounded-lg bg-neutral-200/80" />
      <div className="ml-3 h-4 w-36 animate-pulse rounded bg-neutral-200/80" />
    </header>
  );
}

async function DeskTopBar() {
  const ctx = await requireDeskSession();
  const { counts, schemaMissing } = await getDeskNotificationCounts(
    ctx.workspace.id,
  );

  return (
    <TopBar
      shopName={ctx.workspace.name}
      notificationCounts={counts}
      notificationsMissing={schemaMissing}
    />
  );
}

/** Shell stays mounted; only TopBar + page bodies suspend independently. */
export function DeskFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50">
      <Suspense fallback={<TopBarFallback />}>
        <DeskTopBar />
      </Suspense>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 md:max-w-5xl lg:max-w-7xl">
        <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
      </main>
      <Suspense
        fallback={
          <nav className="h-[calc(3.5rem+env(safe-area-inset-bottom))] border-t border-neutral-200 bg-white print:hidden" />
        }
      >
        <BottomNav variant="desk" />
      </Suspense>
    </div>
  );
}
