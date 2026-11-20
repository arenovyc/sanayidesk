"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Fixed opaque desk chrome + spacer so content never sits under the notch. */
export function DeskHeaderShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const publish = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--desk-header-h", `${h}px`);
    };

    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    window.addEventListener("resize", publish);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", publish);
    };
  }, []);

  return (
    <>
      <div
        ref={ref}
        className="fixed inset-x-0 top-0 z-30 border-b border-neutral-200 bg-white print:hidden"
      >
        <div className="pt-[max(47px,env(safe-area-inset-top,0px))]">
          {children}
        </div>
      </div>
      <div
        className="shrink-0 print:hidden"
        style={{ height: "var(--desk-header-h, 6.5rem)" }}
        aria-hidden
      />
    </>
  );
}
