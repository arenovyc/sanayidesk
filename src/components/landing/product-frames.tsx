const FRAMES = [
  {
    title: "10 saniyede araç kabulü",
    lines: [
      "06 KMK 789 · Fiat Egea",
      "Periyodik Bakım + Ön Balata",
      "Ahmet Usta · İçeride",
    ],
  },
  {
    title: "WhatsApp fiyat onayı",
    lines: [
      "Parça + İşçilik: ₺6.400",
      "Müşteriye teklif gönderildi ✓",
      "Durum: Onay Bekliyor",
    ],
  },
  {
    title: "Kasa & veresiye takibi",
    lines: [
      "Bugün Tahsilat: ₺18.500",
      "Veresiye Alacak: ₺4.200",
      "Bakımı Gelen Müşteri: 3 Araç",
    ],
  },
] as const;

export function ProductFrames() {
  return (
    <div className="mt-14 grid gap-4 sm:grid-cols-3">
      {FRAMES.map((frame, index) => (
        <div
          key={frame.title}
          className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition duration-500"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="size-2 rounded-full bg-amber-500" />
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              {frame.title}
            </p>
          </div>
          <ul className="space-y-2">
            {frame.lines.map((line) => (
              <li
                key={line}
                className="rounded-lg bg-neutral-950/80 px-3 py-2 text-sm text-neutral-200"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
