import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";

function hasProvider(
  identities: { provider?: string }[] | undefined,
  provider: string,
): boolean {
  return (identities ?? []).some((id) => id.provider === provider);
}

/** After failed password login: tell user Google vs wrong password when we can. */
export async function passwordLoginHint(email: string): Promise<string> {
  const fallback = "E-posta veya şifre yanlış.";
  const admin = createAdminSupabase();
  if (!admin) return fallback;

  const normalized = email.trim().toLowerCase();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) return fallback;

  const matches = (data.users ?? []).filter(
    (u) => (u.email ?? "").toLowerCase() === normalized,
  );
  if (matches.length === 0) return fallback;

  const anyEmail = matches.some((u) => hasProvider(u.identities, "email"));
  const anyGoogle = matches.some((u) => hasProvider(u.identities, "google"));

  if (anyGoogle && !anyEmail) {
    return "Bu e-posta Google girişi ile kayıtlı, yukarıdaki 'Google ile devam et' butonunu kullanın";
  }
  if (anyGoogle && anyEmail) {
    return "Bu e-posta için Google ile giriş dene veya “Şifremi unuttum”.";
  }
  if (anyEmail) {
    return "E-posta veya şifre yanlış. “Şifremi unuttum” ile sıfırlayabilirsin.";
  }
  return fallback;
}
