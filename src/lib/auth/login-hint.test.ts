import assert from "node:assert/strict";
import { describe, it } from "node:test";

/** Pure heuristic mirroring passwordLoginHint matching logic. */
function hintFromMatches(
  matches: { identities: { provider: string }[] }[],
): string {
  const fallback = "E-posta veya şifre yanlış.";
  if (matches.length === 0) return fallback;
  const anyEmail = matches.some((u) =>
    u.identities.some((id) => id.provider === "email"),
  );
  const anyGoogle = matches.some((u) =>
    u.identities.some((id) => id.provider === "google"),
  );
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

describe("passwordLoginHint logic", () => {
  it("google only", () => {
    const msg = hintFromMatches([
      { identities: [{ provider: "google" }] },
    ]);
    assert.ok(msg.includes("Google"));
  });

  it("email provider", () => {
    const msg = hintFromMatches([
      { identities: [{ provider: "email" }] },
    ]);
    assert.ok(msg.includes("Şifremi unuttum"));
  });

  it("both providers", () => {
    const msg = hintFromMatches([
      { identities: [{ provider: "email" }] },
      { identities: [{ provider: "google" }] },
    ]);
    assert.ok(msg.includes("Google"));
    assert.ok(msg.includes("Şifremi unuttum"));
  });
});
