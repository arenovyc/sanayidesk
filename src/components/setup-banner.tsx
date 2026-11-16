import {
  getSupabasePublicEnv,
  hasServiceRoleKey,
  usesNewStyleSupabaseKeys,
} from "@/lib/supabase/env";

export function SetupBanner() {
  if (process.env.NODE_ENV !== "development") return null;

  const publicEnv = getSupabasePublicEnv();
  if (!publicEnv) {
    return (
      <div className="mb-6 w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-950">
        <p className="font-medium">Supabase henüz bağlı değil</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-amber-900">
          <li>
            <code className="font-mono text-xs">.env.local</code> — URL +{" "}
            <strong className="font-medium">Legacy</strong> anon JWT (
            <code className="font-mono text-xs">eyJ…</code>, Publishable{" "}
            <code className="font-mono text-xs">sb_</code> değil)
          </li>
          <li>
            Proje kökünde <code className="font-mono text-xs">npm run db:push</code>{" "}
            (migration 001 → 007)
          </li>
          <li>Auth → Confirm email kapalı (geliştirme)</li>
        </ol>
      </div>
    );
  }

  if (usesNewStyleSupabaseKeys()) {
    return (
      <div className="mb-6 w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-950">
        <p className="font-medium">Yanlış API key formatı</p>
        <p className="mt-1 text-amber-900">
          <code className="font-mono text-xs">sb_publishable_</code> /{" "}
          <code className="font-mono text-xs">sb_secret_</code> Failed to fetch
          verebilir. Settings → API Keys →{" "}
          <strong className="font-medium">View legacy API keys</strong> →{" "}
          <code className="font-mono text-xs">anon</code> ve{" "}
          <code className="font-mono text-xs">service_role</code> (
          <code className="font-mono text-xs">eyJ…</code>) kopyala →{" "}
          <code className="font-mono text-xs">.env.local</code> →{" "}
          <code className="font-mono text-xs">npm run dev</code> yeniden başlat.
        </p>
      </div>
    );
  }

  if (!hasServiceRoleKey()) {
    return (
      <div className="mb-6 w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-950">
        <p className="font-medium">Service role eksik</p>
        <p className="mt-1 text-amber-900">
          Patron e-posta girişi anon JWT ile çalışır.{" "}
          <code className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          kabulcü eklemek ve Personel PIN için gerekir (Settings → API →{" "}
          <strong className="font-medium">Legacy</strong>{" "}
          <code className="font-mono text-xs">service_role</code> secret,{" "}
          <code className="font-mono text-xs">sb_secret_</code> değil).
        </p>
      </div>
    );
  }

  return null;
}
