"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold text-neutral-950">Bir hata oluştu</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Sayfa yüklenirken sorun çıktı. Tekrar dene.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 h-11 rounded-lg bg-neutral-950 px-4 text-sm font-medium text-white"
      >
        Yeniden dene
      </button>
    </main>
  );
}
