/** Manual WhatsApp share text — opens wa.me; no Business API. */

export function waReadyVehicleMessage(input: {
  shopName: string;
  plate: string;
  displayNo?: string | null;
  shopPhone?: string | null;
}): string {
  return [
    `${input.shopName}: aracınız hazır.`,
    `Plaka ${input.plate}`,
    input.displayNo ? `İş ${input.displayNo}` : null,
    input.shopPhone ? `Tel ${input.shopPhone}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function waQuoteSummaryMessage(input: {
  shopName: string;
  plate: string;
  quoteLabel: string;
  shopPhone?: string | null;
}): string {
  return [
    `${input.shopName}: teklif özeti`,
    `Plaka ${input.plate}`,
    input.quoteLabel,
    input.shopPhone ? `Tel ${input.shopPhone}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function waPartsVendorMessage(input: {
  shopName: string;
  plate: string;
  partsPlain: string;
}): string {
  return [
    `${input.shopName} — parça talebi`,
    `Plaka ${input.plate}`,
    input.partsPlain,
  ]
    .filter(Boolean)
    .join("\n");
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
