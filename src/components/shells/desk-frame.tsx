import { Suspense } from "react";
import { BottomNav } from "@/components/shells/bottom-nav";
import { TopBar } from "@/components/shells/top-bar";
import { TrialBanner } from "@/components/shells/trial-banner";
import {
  isPlatformAdminEmail,
  requireDeskSession,
} from "@/lib/auth/get-membership";
import { getDeskNotificationCounts } from "@/lib/data/notifications";
import { getTradeProfile } from "@/lib/trade/profile";

function TopBarFallback() {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] print:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <div className="size-8 shrink-0 rounded-lg bg-neutral-950" />
        <div className="min-w-0 space-y-1.5">
          <div className="h-3.5 w-40 rounded bg-neutral-200/80" />
          <div className="h-3 w-24 rounded bg-neutral-100" />
        </div>
      </div>
      <div className="h-9 w-16 rounded-lg bg-neutral-100" />
    </header>
  );
}

function BottomNavFallback({ labels }: { labels: string[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur print:hidden">
      <ul className="mx-auto flex max-w-lg">
        {labels.map((label) => (
          <li key={label} className="flex-1">
            <div className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium text-neutral-300">
              <div className="size-5 rounded bg-neutral-200/80" />
              {label}
            </div>
          </li>
        ))}
      </ul>
    </nav>
  );
}

async function DeskTopBar() {
  const ctx = await requireDeskSession();
  const { counts, schemaMissing } = await getDeskNotificationCounts(
    ctx.workspace.id,
  );
  const profile = getTradeProfile(ctx.workspace.tradeKind);

  return (
    <>
      <TrialBanner
        trialEndsAt={ctx.workspace.trialEndsAt}
        shopPhone={ctx.workspace.settings.phone}
      />
      <TopBar
        shopName={ctx.workspace.name}
        tradeLabel={profile.shortLabel}
        notificationCounts={counts}
        notificationsMissing={schemaMissing}
        showPlatformAdmin={isPlatformAdminEmail(ctx.authEmail)}
      />
    </>
  );
}

async function DeskBottomNav() {
  const ctx = await requireDeskSession();
  return <BottomNav variant="desk" tradeKind={ctx.workspace.tradeKind} />;
}

/**
 * Shell (top + bottom) stays put on tab switches.
 * Only the main slot streams — no wrapping Suspense around children
 * (route loading.tsx handles that once).
 */
export function DeskFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50">
      <Suspense fallback={<TopBarFallback />}>
        <DeskTopBar />
      </Suspense>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 md:max-w-5xl lg:max-w-7xl">
        {children}
      </main>
      <Suspense
        fallback={
          <BottomNavFallback
            labels={["Bugün", "İşler", "…", "Tahsilat", "Daha fazla"]}
          />
        }
      >
        <DeskBottomNav />
      </Suspense>
    </div>
  );
}
