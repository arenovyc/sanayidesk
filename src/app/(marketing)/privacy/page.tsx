import type { Metadata } from "next";
import { MarketingShell } from "@/components/landing/marketing-shell";

export const metadata: Metadata = {
  title: "Gizlilik",
};

export default function PrivacyPage() {
  return (
    <MarketingShell tone="light">
      <main className="mx-auto max-w-lg px-4 py-12 text-sm leading-6 text-neutral-700">
        <h1 className="text-2xl font-semibold text-neutral-950">Gizlilik</h1>
        <p className="mt-4">
          Bu metin yer tutucudur. Canlıya almadan önce hukuki danışmanla KVKK /
          gizlilik metnini doldurman gerekir.
        </p>
        <p className="mt-3">
          Uygulama dükkan iş emri, müşteri iletişim ve tahsilat verilerini senin
          Supabase projenizde saklar. Platform işletmecisi olarak veri sorumlusu
          senin sözleşmenle belirlenir.
        </p>
      </main>
    </MarketingShell>
  );
}
