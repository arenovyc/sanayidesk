import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/logout-button";
import { DeskBell } from "@/components/shells/desk-bell";
import { IstanbulDateLabel } from "@/components/shells/istanbul-date";
import type { DeskNotificationCounts } from "@/lib/notifications/counts";

export function TopBar({
  shopName,
  tradeLabel,
  logoutMode = "desk",
  notificationCounts,
  notificationsMissing,
  showPlatformAdmin = false,
}: {
  shopName: string;
  tradeLabel?: string;
  logoutMode?: "desk" | "staff";
  notificationCounts?: DeskNotificationCounts;
  notificationsMissing?: boolean;
  showPlatformAdmin?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] print:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <Logo variant="mark" tone="light" href={logoutMode === "desk" ? "/today" : null} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-950">{shopName}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {tradeLabel ? (
              <span className="text-[11px] font-medium text-neutral-500">
                {tradeLabel}
              </span>
            ) : null}
            <IstanbulDateLabel className="text-xs text-neutral-500" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {showPlatformAdmin ? (
          <Link
            href="/admin"
            className="mr-1 rounded-lg px-2 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
          >
            Platform
          </Link>
        ) : null}
        {logoutMode === "desk" && notificationCounts ? (
          <DeskBell
            counts={notificationCounts}
            schemaMissing={notificationsMissing}
          />
        ) : null}
        <LogoutButton mode={logoutMode} />
      </div>
    </header>
  );
}
