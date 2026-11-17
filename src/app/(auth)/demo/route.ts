import { connection } from "next/server";
import { NextResponse } from "next/server";
import { getSiteUrl, MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  await connection();
  const siteUrl = getSiteUrl();
  const email = process.env.DEMO_LOGIN_EMAIL?.trim();
  const password = process.env.DEMO_LOGIN_PASSWORD?.trim();

  if (!email || !password) {
    return NextResponse.redirect(
      new URL("/?demo=missing", siteUrl),
    );
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.redirect(
      new URL(`/?demo=error&msg=${encodeURIComponent(MISSING_SUPABASE_ENV)}`, siteUrl),
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
