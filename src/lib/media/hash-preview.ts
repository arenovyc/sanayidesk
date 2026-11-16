import { createHash } from "node:crypto";

/** Payload for message_events — no raw WhatsApp text. */
export function messagePreviewPayload(text: string) {
  const normalized = text.trim();
  return {
    len: normalized.length,
    sha256: createHash("sha256").update(normalized, "utf8").digest("hex"),
  };
}
