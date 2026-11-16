export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-4 py-10">
      {children}
    </div>
  );
}
