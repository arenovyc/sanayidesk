import { BottomNav } from "@/components/shells/bottom-nav";
import { TopBar } from "@/components/shells/top-bar";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { getDeskNotificationCounts } from "@/lib/data/notifications";

export async function DeskFrame({ children }: { children: React.ReactNode }) {
  const ctx = await requireDeskSession();
  const { counts, schemaMissing } = await getDeskNotificationCounts(
    ctx.workspace.id,
  );

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50">
      <TopBar
        shopName={ctx.workspace.name}
        notificationCounts={counts}
        notificationsMissing={schemaMissing}
      />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 md:max-w-5xl lg:max-w-7xl">
        {children}
      </main>
      <BottomNav variant="desk" />
    </div>
  );
}
