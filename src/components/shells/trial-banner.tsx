import Link from "next/link";
import { MONTHLY_PRICE_LABEL, PRICE_NOTE } from "@/lib/pricing";

export function TrialBanner({
  trialEndsAt,
  shopPhone,
}: {
  trialEndsAt: string | null;
  shopPhone?: string | null;
}) {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt).getTime();
  if (Number.isNaN(end)) return null;
  const days = Math.ceil((end - Date.now()) / 86_400_000);
  if (days > 7) return null;

  const wa =
    shopPhone && shopPhone.replace(/\D/g, "").length >= 10
      ? `https://wa.me/90${shopPhone.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(
          "SanayiDesk abonelik / havale bilgisi",
        )}`
      : null;

  const urgent = days <= 2;
  return (
    <div
      className={
        urgent
          ? "border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950"
          : "border-b border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700"
      }
    >
      <div className="mx-auto flex max-w-lg flex-wrap items-center justify-between gap-2 md:max-w-5xl lg:max-w-7xl">
        <p>
          {days < 0
            ? "Deneme süresi doldu."
            : days === 0
              ? "Deneme bugün bitiyor."
              : `Denemenin bitmesine ${days} gün kaldı.`}{" "}
          <span className="text-neutral-500">
            {MONTHLY_PRICE_LABEL}/ay · {PRICE_NOTE}
          </span>
        </p>
        <div className="flex gap-2">
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline-offset-4 hover:underline"
            >
              WhatsApp
            </a>
          ) : (
            <Link
              href="/fiyat"
              className="font-medium underline-offset-4 hover:underline"
            >
              Fiyat
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
