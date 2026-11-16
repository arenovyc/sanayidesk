import { Suspense } from "react";
import { LiftFrame } from "@/components/shells/lift-frame";
import { ShellFallback } from "@/components/shells/shell-fallback";

export default function LiftLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <LiftFrame>{children}</LiftFrame>
    </Suspense>
  );
}
