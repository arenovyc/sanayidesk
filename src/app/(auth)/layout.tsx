import { Logo } from "@/components/brand/logo";
import { SetupBanner } from "@/components/setup-banner";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="mb-6">
        <Logo variant="full" tone="light" />
      </div>
      <SetupBanner />
      {children}
    </div>
  );
}
