import { connection } from "next/server";
import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { isTradeKind } from "@/lib/trade/kinds";

/** Clear any demo/session cookies, then show empty /register form. */
export async function GET(request: Request) {
  await connection();
  const supabase = await createServerSupabase();
  if (supabase) {
    await supabase.auth.signOut({ scope: "global" });
  }
  const url = new URL(request.url);
  const tur = url.searchParams.get("tur");
  const dest = new URL("/register", getSiteUrl());
  if (tur && isTradeKind(tur)) dest.searchParams.set("tur", tur);
  return NextResponse.redirect(dest);
}
