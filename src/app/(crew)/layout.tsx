import { Suspense } from "react";
import { CrewFrame } from "@/components/shells/crew-frame";
import { ShellFallback } from "@/components/shells/shell-fallback";

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <CrewFrame>{children}</CrewFrame>
    </Suspense>
  );
}
