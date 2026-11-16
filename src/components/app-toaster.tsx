"use client";

import { useSyncExternalStore } from "react";
import { Toaster } from "sonner";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function AppToaster() {
  const mounted = useIsClient();
  if (!mounted) return null;
  return <Toaster position="top-center" richColors />;
}
