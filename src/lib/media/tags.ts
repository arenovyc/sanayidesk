import type { MediaTag } from "@/lib/work-orders/types";

export const MEDIA_TAG_LABELS: Record<MediaTag, string> = {
  entry_damage: "Giriş Hasarı",
  old_part: "Eski Parça",
  new_part: "Yeni Parça",
};

export const MEDIA_TAG_OPTIONS: MediaTag[] = [
  "entry_damage",
  "old_part",
  "new_part",
];

export function isMediaTag(value: string): value is MediaTag {
  return MEDIA_TAG_OPTIONS.includes(value as MediaTag);
}
