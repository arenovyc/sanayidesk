/** Static product mock — not interactive, reads like the real desk UI. */
export function HomeBoardPreview() {
  return (
    <div
      aria-hidden
      className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.75)]"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-400">İş tahtası</span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            Canlı önizleme
          </span>
        </div>
        <span className="text-xs text-zinc-500">17 Kas</span>
      </div>

      <div className="grid grid-cols-3 gap-px bg-white/5 p-3">
        {[
          { label: "Kabul", count: 2, active: false },
          { label: "İçeride", count: 3, active: true },
          { label: "Hazır", count: 1, active: false },
        ].map((col) => (
          <div
            key={col.label}
            className="rounded-lg bg-[#09090b]/80 px-2 py-2 text-center"
          >
            <p className="text-[10px] font-medium text-zinc-500">{col.label}</p>
            <p
              className={
                col.active
                  ? "text-lg font-semibold text-amber-400"
                  : "text-lg font-semibold text-zinc-200"
              }
            >
              {col.count}
            </p>
          </div>
        ))}
      </div>

      <UsageCard
        plate="06 KMK 789"
        vehicle="Fiat Egea"
        badge={{ text: "Müşteri Onayladı ✓", tone: "emerald" }}
        mechanic="Ahmet Usta"
        amount="₺6.400"
        status="İçeride"
      />
      <UsageCard
        plate="34 ORN 001"
        vehicle="Örnek iş"
        badge={{ text: "Onay Bekliyor", tone: "amber" }}
        mechanic="—"
        amount="₺2.150"
        status="Kabul"
        muted
      />

      <div className="border-t border-white/10 bg-[#0c0c0e] px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Bugün Kasa</span>
          <span className="font-semibold tabular-nums text-emerald-400">
            ₺18.500
          </span>
        </div>
        <p className="mt-1 text-[11px] text-zinc-600">
          Veresiye · WhatsApp onay · usta ataması
        </p>
      </div>
    </div>
  );
}

function UsageCard({
  plate,
  vehicle,
  badge,
  mechanic,
  amount,
  status,
  muted,
}: {
  plate: string;
  vehicle: string;
  badge: { text: string; tone: "emerald" | "amber" };
  mechanic: string;
  amount: string;
  status: string;
  muted?: boolean;
}) {
  const badgeClass =
    badge.tone === "emerald"
      ? "bg-emerald-500/15 text-emerald-400"
      : "bg-amber-500/15 text-amber-400";

  return (
    <div
      className={
        muted
          ? "mx-3 mb-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
          : "mx-3 mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-3"
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-medium tracking-wide text-zinc-100">
            {plate}
          </p>
          <p className="text-xs text-zinc-500">{vehicle}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}
        >
          {badge.text}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-zinc-500">
          {mechanic} · <span className="text-zinc-400">{status}</span>
        </span>
        <span className="font-medium tabular-nums text-zinc-200">{amount}</span>
      </div>
    </div>
  );
}