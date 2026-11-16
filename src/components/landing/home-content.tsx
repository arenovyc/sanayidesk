import Link from "next/link";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { ProductFrames } from "@/components/landing/product-frames";
import { Button } from "@/components/ui/button";
import { TRIAL_DAYS } from "@/lib/pricing";

type HomeContentProps = {
  panelHref: string | null;
  needsRegister: boolean;
  showPlatformAdmin: boolean;
};

export function HomeContent({
  panelHref,
  needsRegister,
  showPlatformAdmin,
}: HomeContentProps) {
  return (
    <MarketingShell
      panelHref={panelHref}
      showPlatformAdmin={showPlatformAdmin}
      tone="dark"
    >
      <main className="mx-auto flex w-full max-w-5xl flex-col px-4 pb-20 pt-10 md:pt-16">
        <p className="text-sm font-medium tracking-wide text-amber-400/90 motion-safe:animate-[fadeUp_0.5s_ease-out]">
          Oto sanayi için
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-white motion-safe:animate-[fadeUp_0.6s_ease-out] md:text-5xl">
          Dükkanın için iş takibi
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-neutral-400 motion-safe:animate-[fadeUp_0.7s_ease-out]">
          Gelen aracı saniyeler içinde kaydet, ustaya iş ata, veresiyeni ve
          stoğunu takip et. Bakım zamanı gelen eski müşterini tek tuşla dükkana
          geri çağır.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {needsRegister ? (
            <Button
              asChild
              size="lg"
              className="bg-amber-500 text-neutral-950 hover:bg-amber-400"
            >
              <Link href="/register">Dükkanı tamamla</Link>
            </Button>
          ) : panelHref ? (
            <Button
              asChild
              size="lg"
              className="bg-amber-500 text-neutral-950 hover:bg-amber-400"
            >
              <Link href={panelHref}>Panele git</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                size="lg"
                className="bg-amber-500 text-neutral-950 hover:bg-amber-400"
              >
                <Link href="/register">{TRIAL_DAYS} gün ücretsiz başla</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-zinc-600 bg-zinc-900/70 text-zinc-100 hover:bg-zinc-900 hover:text-white"
              >
                <Link href="/demo">Kayıt olmadan canlı demoyu incele</Link>
              </Button>
            </>
          )}
        </div>

        <ProductFrames />

        <p className="mt-10 text-center text-sm text-neutral-500">
          {TRIAL_DAYS} gün ücretsiz · kart yok · kurulum yok — telefondan ve
          bilgisayardan anında çalışır.
        </p>
        <p className="mt-2 text-center text-xs leading-5 text-neutral-600">
          Resmi muhasebe veya maliyeye bağlı değildir — sadece dükkan içi iş ve
          veresiye takibidir.
        </p>

        <section className="mt-20 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-white">Tek dükkan</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              Hızlı plaka kabulü, iş tahtası, usta atama, araç fotoğrafı, parça
              ve işçilik hesabı, veresiye takibi, Excel dökümü ve WhatsApp&apos;tan
              tek tıkla fiyat onayı / araç hazır mesajı.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Sanayi ağı</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              Komşu dükkanlarla ortak rehber, anlaşmalı dükkanlarda plaka özeti,
              dükkanlar arası parça transferi ve taşeron/parçacı cari hesabı.
            </p>
          </div>
        </section>

        <section
          id="nasil-calisir"
          className="mt-16 scroll-mt-24 border-t border-neutral-800 pt-10"
        >
          <h2 className="text-lg font-semibold text-white">Nasıl çalışır</h2>
          <ol className="mt-4 grid gap-4 md:grid-cols-3">
            <li className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
              <p className="text-xs font-medium text-amber-400">1</p>
              <p className="mt-2 text-sm font-medium text-white">Dükkanı aç</p>
              <p className="mt-1 text-sm text-neutral-400">
                Google veya e-posta ile hesap; dükkan kodu ve usta PIN.
              </p>
            </li>
            <li className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
              <p className="text-xs font-medium text-amber-400">2</p>
              <p className="mt-2 text-sm font-medium text-white">Plaka kabul et</p>
              <p className="mt-1 text-sm text-neutral-400">
                Tahtada takip et, ustaya ata, tahsilatı kaydet.
              </p>
            </li>
            <li className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
              <p className="text-xs font-medium text-amber-400">3</p>
              <p className="mt-2 text-sm font-medium text-white">Ağa açıl</p>
              <p className="mt-1 text-sm text-neutral-400">
                İstersen komşu dükkanlarla plaka özeti ve stok transferi.
              </p>
            </li>
          </ol>
        </section>

        <section className="mt-16 border-t border-neutral-800 pt-10">
          <h2 className="text-lg font-semibold text-white">SSS</h2>
          <dl className="mt-4 space-y-5">
            <div>
              <dt className="text-sm font-medium text-white">Usta nasıl girer?</dt>
              <dd className="mt-1 text-sm text-neutral-400">
                Telefonda /pin — dükkan kodu + 4 haneli PIN. E-posta gerekmez.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-white">Sanayi ağı nedir?</dt>
              <dd className="mt-1 text-sm text-neutral-400">
                Rızanla görünür dükkanlar arasında plaka özeti ve stok transferi.
                Zorunlu değil.
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </MarketingShell>
  );
}
