import { Suspense } from "react";
import { DeskFrame } from "@/components/shells/desk-frame";
import { ShellFallback } from "@/components/shells/shell-fallback";

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <DeskFrame>{children}</DeskFrame>
    </Suspense>
  );
}
