import {
  SCHEMA_HINT_DB_PUSH,
  SCHEMA_UNAVAILABLE,
  showSchemaHints,
} from "@/lib/ui/schema-hints";

/** Migration / schema gap message. Dev: db:push. Prod: quiet unavailable or null. */
export function SchemaHintBanner({
  missing,
  quietProd = false,
}: {
  missing: boolean;
  /** When true, production shows nothing instead of unavailable copy. */
  quietProd?: boolean;
}) {
  if (!missing) return null;
  if (!showSchemaHints()) {
    if (quietProd) return null;
    return (
      <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
        {SCHEMA_UNAVAILABLE}
      </p>
    );
  }
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      {SCHEMA_HINT_DB_PUSH}
    </p>
  );
}
