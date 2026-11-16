import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export default function SuspendedPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 py-10">
      <h1 className="text-xl font-semibold">Dükkan askıda</h1>
      <p className="text-sm text-neutral-600">
        Bu dükkan platform tarafından askıya alındı. Desk, usta ve ekip girişi
        kapalı. Sorun için destek ile iletişime geç.
      </p>
      <form action={logoutAction}>
        <Button type="submit" variant="outline">
          Çıkış
        </Button>
      </form>
      <Link href="/login" className="text-sm text-neutral-500 underline-offset-4 hover:underline">
        Giriş sayfası
      </Link>
    </div>
  );
}
