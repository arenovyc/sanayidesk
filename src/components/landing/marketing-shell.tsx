import Link from "next/link";
import { Logo } from "@/components/brand/logo";

type MarketingShellProps = {
  children: React.ReactNode;
  panelHref?: string | null;
  showPlatformAdmin?: boolean;
  tone?: "dark" | "light";
};

export function MarketingShell({
  children,
  panelHref = null,
  showPlatformAdmin = false,
  tone = "dark",
}: MarketingShellProps) {
  const dark = tone === "dark";

  return (
    <div
      className={
        dark
          ? "relative min-h-dvh scroll-smooth overflow-hidden bg-neutral-950 text-neutral-50"
          : "relative min-h-dvh scroll-smooth bg-neutral-50 text-neutral-950"
      }
    >
      {dark ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(245,158,11,0.18),transparent_50%),radial-gradient(ellipse_at_90%_20%,rgba(255,255,255,0.06),transparent_40%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:48px_48px]"
          />
        </>
      ) : null}

      <header
        className={
          dark
            ? "relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-5"
            : "sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur"
        }
      >
        <div
          className={
            dark
              ? "flex w-full items-center justify-between gap-3"
              : "mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4"
          }
        >
          <Logo variant="full" tone={dark ? "dark" : "light"} />
          <nav
            className={
              dark
                ? "flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm text-neutral-300"
                : "flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm text-neutral-600"
            }
          >
            {showPlatformAdmin ? (
              <Link
                href="/admin"
                className={dark ? "hover:text-white" : "hover:text-neutral-950"}
              >
                Yönetim
              </Link>
            ) : null}
            {panelHref ? (
              <Link
                href={panelHref}
                className={dark ? "hover:text-white" : "hover:text-neutral-950"}
              >
                Panele git
              </Link>
            ) : (
              <Link
                href="/login"
                className={dark ? "hover:text-white" : "hover:text-neutral-950"}
              >
                Dükkan Girişi
              </Link>
            )}
            <Link
              href="/pin"
              className={dark ? "hover:text-white" : "hover:text-neutral-950"}
            >
              Usta PIN
            </Link>
          </nav>
        </div>
      </header>

      <div className="relative z-10">{children}</div>

      <footer
        className={
          dark
            ? "relative z-10 mx-auto w-full max-w-5xl border-t border-neutral-900 px-4 py-6 text-xs text-neutral-500"
            : "mx-auto w-full max-w-5xl border-t border-neutral-200 px-4 py-6 text-xs text-neutral-500"
        }
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link href="/fiyat" className="underline-offset-4 hover:underline">
            Fiyat
          </Link>
          <span aria-hidden>·</span>
          <Link href="/apply" className="underline-offset-4 hover:underline">
            Başvuru
          </Link>
          <span aria-hidden>·</span>
          <Link href="/privacy" className="underline-offset-4 hover:underline">
            Gizlilik
          </Link>
          <span aria-hidden>·</span>
          <Link href="/terms" className="underline-offset-4 hover:underline">
            Kullanım şartları
          </Link>
          <span aria-hidden>·</span>
          <a
            href="mailto:destek@sanayidesk.com"
            className="underline-offset-4 hover:underline"
          >
            destek@sanayidesk.com
          </a>
        </div>
      </footer>
    </div>
  );
}
