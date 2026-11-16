import type { Metadata } from "next";
import { MarketingShell } from "@/components/landing/marketing-shell";

export const metadata: Metadata = {
  title: "Kullanım şartları",
};

export default function TermsPage() {
  return (
    <MarketingShell tone="light">
      <main className="mx-auto max-w-lg px-4 py-12 text-sm leading-6 text-neutral-700">
        <h1 className="text-2xl font-semibold text-neutral-950">
          Kullanım şartları
        </h1>
        <p className="mt-4">
          Bu metin yer tutucudur. Hizmet şartları, deneme süresi ve ücretlendirme
          canlıya çıkmadan güncellenmelidir.
        </p>
        <p className="mt-3">
          Yazılım “olduğu gibi” sunulur; iş kararlarından dükkan işletmecisi
          sorumludur.
        </p>
      </main>
    </MarketingShell>
  );
}
