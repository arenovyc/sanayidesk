import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold text-neutral-950">Sayfa yok</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Aradığın adres bulunamadı veya taşındı.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm font-medium text-neutral-950 underline-offset-4 hover:underline"
      >
        Ana sayfaya dön
      </Link>
    </main>
  );
}
