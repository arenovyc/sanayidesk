import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { TRIAL_DAYS } from "@/lib/pricing";

type MarketingShellProps = {
  children: React.ReactNode;
  sessionLoggedIn?: boolean;
  panelHref?: string | null;
  showPlatformAdmin?: boolean;
  tone?: "dark" | "light";
};

export function MarketingShell({
  children,
  sessionLoggedIn = false,
  panelHref = null,
  showPlatformAdmin = false,
  tone = "dark",
}: MarketingShellProps) {
  const dark = tone === "dark";
  const panelTarget = panelHref ?? "/register";

  return (
    <div
      className={
        dark
          ? "relative min-h-dvh scroll-smooth overflow-hidden bg-[#09090b] text-zinc-50"
          : "relative min-h-dvh scroll-smooth bg-neutral-50 text-neutral-950"
      }
    >
      {dark ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:56px_56px]"
        />
      ) : null}

      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Logo variant="full" tone={dark ? "dark" : "light"} />
          {!sessionLoggedIn ? (
            <nav className="flex flex-wrap items-center justify-end gap-2 text-sm text-zinc-300 sm:gap-3">
              <Link
                href="/#ozellikler"
                className="hidden px-2 py-1 hover:text-white sm:inline"
              >
                Özellikler
              </Link>
              <Link href="/pin" className="px-2 py-1 hover:text-white">
                Usta PIN
              </Link>
              <Link href="/login" className="px-2 py-1 hover:text-white">
                Giriş Yap
              </Link>
              <Button
                asChild
                size="sm"
                className="bg-amber-500 text-zinc-950 hover:bg-amber-400"
              >
                <Link href="/register">{TRIAL_DAYS} Gün Ücretsiz Başla</Link>
              </Button>
            </nav>
          ) : (
            <nav className="flex items-center gap-2 sm:gap-3">
              {showPlatformAdmin ? (
                <Link
                  href="/admin"
                  className="text-xs font-medium text-zinc-400 hover:text-zinc-100"
                >
                  Yönetim
                </Link>
              ) : null}
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10"
              >
                <Link href={panelTarget}>
                  Panele Git <span aria-hidden>→</span>
                </Link>
              </Button>
            </nav>
          )}
        </div>
      </header>

      <div className="relative z-10">{children}</div>

      <footer
        className={
          dark
            ? "relative z-10 mx-auto w-full max-w-6xl border-t border-white/10 px-4 py-8 text-xs text-zinc-500"
            : "mx-auto w-full max-w-6xl border-t border-neutral-200 px-4 py-8 text-xs text-neutral-500"
        }
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link
            href="/fiyat"
            className={
              dark ? "underline-offset-4 hover:text-zinc-300" : "underline-offset-4 hover:underline"
            }
          >
            Fiyat
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/apply"
            className={
              dark ? "underline-offset-4 hover:text-zinc-300" : "underline-offset-4 hover:underline"
            }
          >
            Başvuru
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/privacy"
            className={
              dark ? "underline-offset-4 hover:text-zinc-300" : "underline-offset-4 hover:underline"
            }
          >
            Gizlilik
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/terms"
            className={
              dark ? "underline-offset-4 hover:text-zinc-300" : "underline-offset-4 hover:underline"
            }
          >
            Kullanım şartları
          </Link>
          <span aria-hidden>·</span>
          <a
            href="mailto:destek@sanayidesk.com"
            className={
              dark ? "underline-offset-4 hover:text-zinc-300" : "underline-offset-4 hover:underline"
            }
          >
            destek@sanayidesk.com
          </a>
        </div>
      </footer>
    </div>
  );
}