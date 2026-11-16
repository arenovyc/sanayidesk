import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { homeForRole, type MembershipRole } from "@/lib/auth/roles";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

function safeNextPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = safeNextPath(url.searchParams.get("next"));
  const env = getSupabasePublicEnv();

  if (!env || !code) {
    return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  }

  if (nextPath === "/reset-password" || nextPath?.startsWith("/reset-password")) {
    return NextResponse.redirect(new URL("/reset-password", url.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!appUser) {
    return NextResponse.redirect(new URL(nextPath ?? "/register", url.origin));
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", appUser.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const target =
    nextPath && nextPath !== "/register"
      ? nextPath
      : membership
        ? homeForRole(membership.role as MembershipRole)
        : "/register";

  return NextResponse.redirect(new URL(target, url.origin));
}
