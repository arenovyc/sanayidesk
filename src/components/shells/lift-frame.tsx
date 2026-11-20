import { BottomNav } from "@/components/shells/bottom-nav";
import { DeskHeaderShell } from "@/components/shells/desk-header-shell";
import { TopBar } from "@/components/shells/top-bar";
import { requireLiftSession } from "@/lib/auth/get-membership";

export async function LiftFrame({ children }: { children: React.ReactNode }) {
  const ctx = await requireLiftSession();

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50">
      <DeskHeaderShell>
        <TopBar shopName={ctx.workspace.name} logoutMode="staff" />
      </DeskHeaderShell>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4">
        {children}
      </main>
      <BottomNav variant="lift" />
    </div>
  );
}
