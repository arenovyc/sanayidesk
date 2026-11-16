import { SetupBanner } from "@/components/setup-banner";

export default function AuthPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-4 py-10">
      <p className="mb-6 text-lg font-semibold tracking-tight text-neutral-950">
        SanayiDesk
      </p>
      <SetupBanner />
      {children}
    </div>
  );
}
