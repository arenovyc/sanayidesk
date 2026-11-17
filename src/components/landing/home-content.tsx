import Link from "next/link";
import {
  Building2,
  Check,
  ClipboardList,
  MessageCircle,
  Network,
  Wallet,
} from "lucide-react";
import { HomeBoardPreview } from "@/components/landing/home-board-preview";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { Button } from "@/components/ui/button";
import { TRIAL_DAYS } from "@/lib/pricing";

type HomeContentProps = {
  sessionLoggedIn: boolean;
  panelHref: string | null;
  showPlatformAdmin: boolean;
};

export function HomeContent({
  sessionLoggedIn,
  panelHref,
  showPlatformAdmin,
}: HomeContentProps) {
  return (
    <MarketingShell
      sessionLoggedIn={sessionLoggedIn}
      panelHref={panelHref}
      showPlatformAdmin={showPlatformAdmin}
      tone="dark"
    >
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 md:pt-14">
        <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-amber-400/90">
              OTO TAMİR VE ÖZEL SERVİSLER İÇİN
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white md:text-[2.75rem] md:leading-[1.15]">
              Sanayideki dükkanını telefondan yönet.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-zinc-400">
              Plaka kabul, fotoğraflı WhatsApp fiyat onayı, usta takibi ve
              veresiye defteri tek yerde. Kurulum yok, muhasebe karmaşası yok.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                size="lg"
                className="bg-amber-500 text-zinc-950 hover:bg-amber-400"
              >
                <Link href="/register">
                  {TRIAL_DAYS} Gün Ücretsiz Dükkan Aç
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/15 bg-transparent text-zinc-100 hover:bg-white/5 hover:text-white"
              >
                <Link href="/demo">Kayıt Olmadan Canlı Demoyu Gör</Link>
              </Button>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                Kart bilgisi gerekmez
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                Resmi muhasebe veya maliyeye bağlı değildir — sadece dükkan içi
                takiptir.
              </li>
            </ul>
          </div>

          <div className="lg:justify-self-end lg:max-w-md lg:pl-4">
            <HomeBoardPreview />
          </div>
        </section>

        <section
          id="nasil-calisir"
          className="mt-20 scroll-mt-24 border-t border-white/10 pt-16"
        >
          <h2 className="text-center text-xl font-semibold text-white">
            Nasıl çalışır?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-zinc-500">
            Üç adımda günlük rutin — kurulum yok, kart yok.
          </p>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Plaka Kabul",
                body: "Gelen aracı saniyeler içinde kaydet; tahtada sütunlarda takip et.",
                icon: ClipboardList,
              },
              {
                n: "02",
                title: "WhatsApp Fiyat Onayı",
                body: "Kalemleri gir, tek tıkla müşteriye onay linki veya mesaj gönder.",
                icon: MessageCircle,
              },
              {
                n: "03",
                title: "Kasa & Bakım Hatırlatma",
                body: "Tahsilat ve veresiye; bakım zamanı gelen müşteriyi geri çağır.",
                icon: Wallet,
              },
            ].map((step) => (
              <li
                key={step.n}
                className="rounded-2xl border border-white/10 bg-[#111827]/60 p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-semibold text-amber-400">
                    {step.n}
                  </span>
                  <step.icon className="size-5 text-zinc-400" aria-hidden />
                </div>
                <p className="mt-3 text-base font-medium text-white">
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="ozellikler"
          className="mt-16 scroll-mt-24 grid gap-4 md:grid-cols-2"
        >
          <FeatureCard
            icon={Building2}
            title="Tek dükkan"
            items={[
              "Hızlı plaka kabulü ve renkli iş tahtası",
              "Usta atama, iş fotoğrafı, parça ve işçilik",
              "Veresiye, Excel dökümü, WhatsApp hazır / onay",
            ]}
          />
          <FeatureCard
            icon={Network}
            title="Sanayi ağı"
            items={[
              "İsteğe bağlı komşu dükkan rehberi",
              "Anlaşmalı dükkanlarda plaka özeti",
              "Stok transferi ve taşeron cari (isteğe bağlı)",
            ]}
          />
        </section>

        <section className="mt-16 border-t border-white/10 pt-12">
          <h2 className="text-lg font-semibold text-white">SSS</h2>
          <dl className="mt-6 space-y-6">
            <div>
              <dt className="text-sm font-medium text-white">
                Usta nasıl girer?
              </dt>
              <dd className="mt-1.5 text-sm leading-6 text-zinc-400">
                Telefonda /pin — dükkan kodu + 4 haneli PIN. E-posta gerekmez.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-white">
                Sanayi ağı nedir?
              </dt>
              <dd className="mt-1.5 text-sm leading-6 text-zinc-400">
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

function FeatureCard({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Building2;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827]/50 p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <Icon className="size-5 text-amber-400" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-sm leading-6 text-zinc-400"
          >
            <Check className="mt-0.5 size-4 shrink-0 text-zinc-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}