import { randomUUID } from "node:crypto";

export function buildMediaStoragePath(
  workspaceId: string,
  workOrderId: string,
  ext: string,
): string {
  const cleanExt = ext.replace(/^\./, "").toLowerCase() || "jpg";
  return `${workspaceId}/${workOrderId}/${randomUUID()}.${cleanExt}`;
}

export function extensionFromContentType(contentType: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}
