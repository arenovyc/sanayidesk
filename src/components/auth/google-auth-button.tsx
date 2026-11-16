"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function GoogleAuthButton({ label }: { label: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    setPending(true);
    try {
      const supabase = createBrowserSupabase();
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
        window.location.origin;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${siteUrl}/auth/callback`,
        },
      });
      if (oauthError) {
        setError(
          oauthError.message.toLowerCase().includes("provider")
            ? "Google girişi henüz açık değil. Supabase → Authentication → Providers → Google."
            : oauthError.message,
        );
        setPending(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google girişi başarısız");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={onClick}
        className="w-full"
      >
        {pending ? "Yönlendiriliyor…" : label}
      </Button>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
