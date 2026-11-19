import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { MONTHLY_PRICE_LABEL } from "@/lib/pricing";

export default function SuspendedPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 py-10">
      <h1 className="text-xl font-semibold">Dükkan askıda</h1>
      <p className="text-sm text-neutral-600">
        Bu dükkan platform tarafından askıya alındı veya deneme / abonelik
        süresi doldu. Desk, usta ve ekip girişi kapalı.
      </p>
      <p className="text-sm text-neutral-600">
        Yeniden açmak için WhatsApp veya havale ile yazın —{" "}
        {MONTHLY_PRICE_LABEL}/ay (KDV dahil, kurucu fiyatı).
      </p>
      <p className="text-sm">
        <Link
          href="/fiyat"
          className="font-medium underline-offset-4 hover:underline"
        >
          Fiyat sayfası
        </Link>
      </p>
      <form action={logoutAction}>
        <Button type="submit" variant="outline">
          Çıkış
        </Button>
      </form>
      <Link
        href="/login"
        className="text-sm text-neutral-500 underline-offset-4 hover:underline"
      >
        Giriş sayfası
      </Link>
    </div>
  );
}
