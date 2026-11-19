/** Manual WhatsApp share text — opens wa.me; no Business API. */

function plateLine(plate?: string | null): string | null {
  const p = plate?.trim();
  if (!p) return null;
  return `Plaka ${p}`;
}

function subjectLine(input: {
  plate?: string | null;
  title?: string | null;
  displayNo?: string | null;
}): string | null {
  const title = input.title?.trim();
  if (title) return title;
  return plateLine(input.plate);
}

export function waReadyVehicleMessage(input: {
  shopName: string;
  plate?: string | null;
  title?: string | null;
  displayNo?: string | null;
  shopPhone?: string | null;
  nextServiceKm?: number | null;
  nextServiceDateLabel?: string | null;
  readyNoun?: "vehicle" | "order" | "job";
}): string {
  const ready =
    input.readyNoun === "order"
      ? "siparişiniz hazır."
      : input.readyNoun === "job"
        ? "işiniz hazır."
        : "aracınız hazır.";
  const nextLine =
    input.nextServiceKm != null
      ? `Bir sonraki bakım: ${input.nextServiceKm.toLocaleString("tr-TR")} km${
          input.nextServiceDateLabel ? ` veya ${input.nextServiceDateLabel}` : ""
        }`
      : null;
  return [
    `${input.shopName}: ${ready}`,
    subjectLine(input),
    input.displayNo ? `İş ${input.displayNo}` : null,
    nextLine,
    input.shopPhone ? `Tel ${input.shopPhone}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function waQuoteSummaryMessage(input: {
  shopName: string;
  plate?: string | null;
  title?: string | null;
  quoteLabel: string;
  shopPhone?: string | null;
  approvalUrl?: string | null;
}): string {
  return [
    `${input.shopName}: teklif özeti`,
    subjectLine(input),
    input.quoteLabel,
    input.approvalUrl
      ? `Onay linki (giriş gerekmez):\n${input.approvalUrl}`
      : null,
    input.shopPhone ? `Tel ${input.shopPhone}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function waPartsVendorMessage(input: {
  shopName: string;
  plate?: string | null;
  title?: string | null;
  partsPlain: string;
}): string {
  return [
    `${input.shopName} — parça talebi`,
    subjectLine(input),
    input.partsPlain,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Plakasız / tezgâh komşu sorusu */
export function waNeighborPartAskMessage(input: {
  shopName: string;
  askText: string;
  shopPhone?: string | null;
}): string {
  return [
    `${input.shopName} — parça / stok sorusu`,
    input.askText,
    input.shopPhone ? `Tel ${input.shopPhone}` : null,
    "Uygunsa fiyat ve stok yazar mısın?",
  ]
    .filter(Boolean)
    .join("\n");
}

export function waNeighborJobReferMessage(input: {
  shopName: string;
  summary: string;
  plate?: string | null;
  shopPhone?: string | null;
}): string {
  return [
    `${input.shopName} — iş paslama`,
    plateLine(input.plate),
    input.summary,
    input.shopPhone ? `Tel ${input.shopPhone}` : null,
    "Uygunsa yaz, konuşalım.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function waMeUrl(phoneDigits: string, text: string): string | null {
  let digits = phoneDigits.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `90${digits.slice(1)}`;
  if (digits.length === 10) digits = `90${digits}`;
  if (!digits.startsWith("90") || digits.length < 12) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function waMaintenanceReminderMessage(input: {
  shopName: string;
  plate: string;
  shopPhone?: string | null;
}): string {
  return [
    `${input.shopName}: bakım zamanı yaklaştı.`,
    `Plaka ${input.plate}`,
    "Randevu için yazın veya arayın.",
    input.shopPhone ? `Tel ${input.shopPhone}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
