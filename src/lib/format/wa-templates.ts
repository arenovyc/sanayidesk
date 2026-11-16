/** Manual WhatsApp share text — opens wa.me; no Business API. */

export function waReadyVehicleMessage(input: {
  shopName: string;
  plate: string;
  displayNo?: string | null;
  shopPhone?: string | null;
  nextServiceKm?: number | null;
  nextServiceDateLabel?: string | null;
}): string {
  const nextLine =
    input.nextServiceKm != null
      ? `Bir sonraki bakım: ${input.nextServiceKm.toLocaleString("tr-TR")} km${
          input.nextServiceDateLabel ? ` veya ${input.nextServiceDateLabel}` : ""
        }`
      : null;
  return [
    `${input.shopName}: aracınız hazır.`,
    `Plaka ${input.plate}`,
    input.displayNo ? `İş ${input.displayNo}` : null,
    nextLine,
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
  approvalUrl?: string | null;
}): string {
  return [
    `${input.shopName}: teklif özeti`,
    `Plaka ${input.plate}`,
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
