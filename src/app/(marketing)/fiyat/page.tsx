import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { Button } from "@/components/ui/button";
import {
  getAuthUser,
  getSessionContext,
  isPlatformAdminEmail,
} from "@/lib/auth/get-membership";
import { homeForRole } from "@/lib/auth/roles";
import {
  MONTHLY_PRICE_LABEL,
  PRICE_NOTE,
  TRIAL_DAYS,
} from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Fiyat",
  description: `${TRIAL_DAYS} gün ücretsiz dene. Sonra ${MONTHLY_PRICE_LABEL}/ay — kart yok, kurulum yok.`,
};

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-neutral-950 text-sm text-neutral-500">
          Yükleniyor…
        </div>
      }
    >
      <PricingBody />
    </Suspense>
  );
}

async function PricingBody() {
  const [ctx, authUser] = await Promise.all([
    getSessionContext(),
    getAuthUser(),
  ]);
  const panelHref = ctx ? homeForRole(ctx.membership.role) : null;
  const showPlatformAdmin = isPlatformAdminEmail(authUser?.email ?? null);

  return (
    <MarketingShell
      panelHref={panelHref}
      showPlatformAdmin={showPlatformAdmin}
      tone="dark"
    >
      <main className="mx-auto flex w-full max-w-5xl flex-col px-4 pb-20 pt-10 md:pt-14">
        <p className="text-sm font-medium tracking-wide text-amber-400/90">
          Fiyat
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {TRIAL_DAYS} gün ücretsiz dene, sonra net aylık ücret
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-neutral-400">
          Kredi kartı istemiyoruz. Dükkanı aç, plaka kabul et, usta PIN ve
          WhatsApp fiyat onayını sahada dene. Beğenirsen devam edersin.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-amber-500/40 bg-neutral-900/80 p-6 shadow-[0_0_0_1px_rgba(245,158,11,0.15)]">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-400">
              Deneme
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {TRIAL_DAYS} gün
            </p>
            <p className="mt-1 text-sm text-neutral-400">Ücretsiz · kart yok</p>
            <ul className="mt-5 space-y-2 text-sm text-neutral-300">
              <li>Tüm desk özellikleri açık</li>
              <li>Usta PIN, tahta, tahsilat, stok</li>
              <li>WhatsApp fiyat onayı ve bakım hatırlatıcı</li>
              <li>Kurulum yok — telefondan ve bilgisayardan</li>
            </ul>
            <Button
              asChild
              size="lg"
              className="mt-6 w-full bg-amber-500 text-neutral-950 hover:bg-amber-400"
            >
              <Link href="/register">{TRIAL_DAYS} gün ücretsiz başla</Link>
            </Button>
          </section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Sonrası
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {MONTHLY_PRICE_LABEL}
              <span className="text-lg font-normal text-neutral-400">/ay</span>
            </p>
            <p className="mt-1 text-sm text-neutral-400">{PRICE_NOTE}</p>
            <ul className="mt-5 space-y-2 text-sm text-neutral-300">
              <li>Tek dükkan, sınırsız iş emri</li>
              <li>Usta / çırak PIN hesapları</li>
              <li>Veresiye, rapor, Excel dökümü</li>
              <li>Deneme bitince abonelik — şu an online kart yok; havale / elden</li>
            </ul>
            <p className="mt-6 text-xs leading-5 text-neutral-500">
              Ostim / Şaşmaz esnafı için kurucu fiyatı. İptal taahhüdü yok;
              verilerin panelde kalır, istediğinde destekle konuşursun.
            </p>
          </section>
        </div>

        <section className="mt-14 border-t border-neutral-800 pt-10">
          <h2 className="text-lg font-semibold text-white">Sık sorulan</h2>
          <dl className="mt-4 space-y-5">
            <div>
              <dt className="text-sm font-medium text-white">
                Kart bilgisi verecek miyim?
              </dt>
              <dd className="mt-1 text-sm text-neutral-400">
                Hayır. Kayıtta kart yok. Deneme bitince birlikte abone oluruz.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-white">
                Usta da girebilir mi?
              </dt>
              <dd className="mt-1 text-sm text-neutral-400">
                Evet — dükkan kodu + 4 haneli PIN ile telefonda /pin.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-white">
                Beğenmezsem ne olur?
              </dt>
              <dd className="mt-1 text-sm text-neutral-400">
                Denemeyi bitirirsin; zorunlu ödeme yok. Verini CSV ile
                indirebilirsin (raporlar).
              </dd>
            </div>
          </dl>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            className="bg-amber-500 text-neutral-950 hover:bg-amber-400"
          >
            <Link href="/register">Dükkanı ücretsiz aç</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-neutral-700 text-neutral-100">
            <Link href="/">Ana sayfa</Link>
          </Button>
        </div>
      </main>
    </MarketingShell>
  );
}
