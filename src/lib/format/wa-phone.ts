import { normalizePhone } from "@/lib/format/phone";

/**
 * Digits for wa.me path (country code, no +).
 * TR: 05xx → 905xx; 5xx → 905xx; already 90… kept.
 * Empty if unusable.
 */
export function waPhoneDigits(raw: string | null | undefined): string | null {
  const digits = normalizePhone(raw ?? "");
  if (!digits) return null;

  if (digits.startsWith("90") && digits.length >= 12) {
    return digits;
  }
  if (digits.startsWith("0") && digits.length >= 11) {
    return `90${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith("5")) {
    return `90${digits}`;
  }
  if (digits.length >= 10) {
    return digits;
  }
  return null;
}

export function waShareHref(preview: string, phone?: string | null): string {
  const text = encodeURIComponent(preview);
  const digits = waPhoneDigits(phone);
  if (digits) return `https://wa.me/${digits}?text=${text}`;
  return `https://wa.me/?text=${text}`;
}
