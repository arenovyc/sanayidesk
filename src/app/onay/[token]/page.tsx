import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ApprovalActions } from "@/components/onay/approval-actions";
import { loadPublicApproval } from "@/lib/data/public-approval";
import { formatMoney } from "@/lib/format/money";
import { MEDIA_TAG_LABELS } from "@/lib/media/tags";

const KIND_LABELS: Record<string, string> = {
  labor: "İşçilik",
  part: "Parça",
  other: "Diğer",
};

const CHECKUP_LABELS: Record<string, string> = {
  brake_pads: "Fren Balatası",
  tires: "Lastikler",
  battery: "Akü",
  wipers: "Silecekler",
  fluids: "Sıvılar / Antifriz",
  belts: "Kayışlar",
};

export default function PublicApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh bg-neutral-100 px-4 py-8">
          <p className="mx-auto max-w-md text-sm text-neutral-500">
            Teklif yükleniyor…
          </p>
        </main>
      }
    >
      <PublicApprovalBody params={params} />
    </Suspense>
  );
}

async function PublicApprovalBody({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length < 8) notFound();

  const data = await loadPublicApproval(token);
  if (!data) notFound();

  const alreadyApproved = Boolean(data.approvedAt);
  const warnings = Object.entries(data.vehicleCheckup).filter(
    ([, level]) => level === "soon" || level === "urgent",
  );

  return (
    <main className="min-h-dvh bg-neutral-100 px-4 py-8">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <header className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Teklif onayı
          </p>
          <h1 className="mt-1 text-xl font-semibold text-neutral-950">
            {data.shopName}
          </h1>
          {data.shopPhone ? (
            <p className="mt-1 text-sm text-neutral-500">Tel {data.shopPhone}</p>
          ) : null}
          <p className="mt-4 font-mono text-2xl tracking-wide text-neutral-950">
            {data.plate}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-neutral-600">
            {data.makeModel ? <span>{data.makeModel}</span> : null}
            {data.entryKm != null ? (
              <span>{data.entryKm.toLocaleString("tr-TR")} km</span>
            ) : null}
            {data.displayNo ? (
              <span className="font-mono text-neutral-500">{data.displayNo}</span>
            ) : null}
          </div>
        </header>

        {data.items.length > 0 ? (
          <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <h2 className="border-b border-neutral-100 px-4 py-3 text-sm font-medium text-neutral-500">
              Yapılacak işlemler
            </h2>
            <ul className="divide-y divide-neutral-100">
              {data.items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between gap-3 px-4 py-3 text-sm"
                >
                  <span>
                    {item.description}
                    <span className="ml-2 text-neutral-400">
                      {KIND_LABELS[item.kind] ?? item.kind}
                    </span>
                  </span>
                  <span className="tabular-nums">{formatMoney(item.amount)}</span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold">
              <span>Toplam</span>
              <span>{formatMoney(data.due)}</span>
            </p>
          </section>
        ) : (
          <p className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500">
            Henüz kalem eklenmemiş. Dükkanı arayın.
          </p>
        )}

        {warnings.length > 0 ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-sm font-medium text-amber-950">Kontrol notları</h2>
            <ul className="mt-2 space-y-1 text-sm text-amber-900">
              {warnings.map(([key, level]) => (
                <li key={key}>
                  {CHECKUP_LABELS[key] ?? key}:{" "}
                  {level === "urgent" ? "Acil değişmeli" : "Yakında değişmeli"}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {data.media.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-neutral-500">Fotoğraflar</h2>
            <ul className="grid grid-cols-2 gap-2">
              {data.media.map((item) => (
                <li
                  key={item.id}
                  className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white"
                >
                  {item.signedUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.signedUrl}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-square bg-neutral-100" />
                  )}
                  {item.tag ? (
                    <span className="absolute left-1.5 top-1.5 rounded bg-neutral-950/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {MEDIA_TAG_LABELS[item.tag]}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {alreadyApproved ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            Bu teklif daha önce onaylandı. Teşekkürler.
          </p>
        ) : (
          <ApprovalActions token={token} />
        )}

        <p className="text-center text-xs text-neutral-400">
          SanayiDesk · giriş gerekmez
        </p>
      </div>
    </main>
  );
}
