import { connection } from "next/server";
import { NextResponse } from "next/server";
import { getSiteUrl, MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { isTradeKind } from "@/lib/trade/kinds";

function demoCreds(tur: string | null): { email?: string; password?: string } {
  const kind = tur && isTradeKind(tur) ? tur : "tamir";
  const suffix = kind === "tamir" ? "" : `_${kind.toUpperCase()}`;
  const email =
    process.env[`DEMO_LOGIN_EMAIL${suffix}`]?.trim() ||
    process.env.DEMO_LOGIN_EMAIL?.trim();
  const password =
    process.env[`DEMO_LOGIN_PASSWORD${suffix}`]?.trim() ||
    process.env.DEMO_LOGIN_PASSWORD?.trim();
  return { email, password };
}

export async function GET(request: Request) {
  await connection();
  const siteUrl = getSiteUrl();
  const url = new URL(request.url);
  const tur = url.searchParams.get("tur");
  const { email, password } = demoCreds(tur);

  if (!email || !password) {
    return NextResponse.redirect(new URL("/?demo=missing", siteUrl));
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.redirect(
      new URL(
        `/?demo=error&msg=${encodeURIComponent(MISSING_SUPABASE_ENV)}`,
        siteUrl,
      ),
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/?demo=error&msg=${encodeURIComponent("Demo girişi başarısız. Daha sonra tekrar dene.")}`,
        siteUrl,
      ),
    );
  }

  return NextResponse.redirect(new URL("/today", siteUrl));
}
