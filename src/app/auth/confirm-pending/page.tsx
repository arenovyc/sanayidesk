import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ConfirmPendingPage() {
  return (
    <Card className="w-full max-w-md">
      <h1 className="mb-1 text-xl font-semibold">E-postanı onayla</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Hesabın oluşturuldu. Gelen kutundaki onay bağlantısına tıkla; sonra
        giriş yapıp dükkanını açabilirsin.
      </p>
      <p className="mt-3 text-sm text-neutral-500">
        Geliştirmede onay kapalıysa Supabase → Authentication → Providers →
        Email → Confirm email’i kapat.
      </p>
      <Button asChild className="mt-6 w-full">
        <Link href="/login">Girişe git</Link>
      </Button>
    </Card>
  );
}
