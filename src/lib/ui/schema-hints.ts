/** Dev-only migration / schema banners. Production stays quiet. */
export function showSchemaHints() {
  return process.env.NODE_ENV === "development";
}

export const SCHEMA_HINT_DB_PUSH =
  "Şema eksik. Proje kökünde npm run db:push çalıştır.";

export const SCHEMA_UNAVAILABLE = "Bu özellik şu an kullanılamıyor.";
