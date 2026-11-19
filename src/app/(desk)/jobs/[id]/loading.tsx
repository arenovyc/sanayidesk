/**
 * Light placeholder — avoid a full-page "Yükleniyor" wipe on soft refresh
 * after status/payment actions. Shell (TopBar + BottomNav) stays put.
 */
export default function JobDetailLoading() {
  return (
    <div className="flex flex-col gap-4 pt-1" aria-busy="true" aria-label="Yükleniyor">
      <div className="h-4 w-16 animate-pulse rounded bg-neutral-200/80" />
      <div className="h-10 w-40 animate-pulse rounded-md bg-neutral-200/80" />
      <div className="h-8 w-full animate-pulse rounded-xl bg-neutral-100" />
      <div className="h-32 w-full animate-pulse rounded-2xl bg-neutral-100" />
    </div>
  );
}
