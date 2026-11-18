import { connection } from "next/server";
import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";

/** Clear any demo/session cookies, then show empty /register form. */
export async function GET() {
  await connection();
  const supabase = await createServerSupabase();
  if (supabase) {
    await supabase.auth.signOut({ scope: "global" });
  }
  return NextResponse.redirect(new URL("/register", getSiteUrl()));
}
