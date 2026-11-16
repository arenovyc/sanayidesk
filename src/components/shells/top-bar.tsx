import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/logout-button";
import { DeskBell } from "@/components/shells/desk-bell";
import { IstanbulDateLabel } from "@/components/shells/istanbul-date";
import type { DeskNotificationCounts } from "@/lib/notifications/counts";

export function TopBar({
  shopName,
  logoutMode = "desk",
  notificationCounts,
  notificationsMissing,
}: {
  shopName: string;
  logoutMode?: "desk" | "staff";
  notificationCounts?: DeskNotificationCounts;
  notificationsMissing?: boolean;
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] print:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <Logo variant="mark" tone="light" href={logoutMode === "desk" ? "/today" : null} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-950">{shopName}</p>
          <IstanbulDateLabel className="text-xs text-neutral-500" />
        </div>
      </div>
      <div className="flex items-center gap-1">
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
