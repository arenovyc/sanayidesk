import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/register",
  "/demo",
  "/pin",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/privacy",
  "/terms",
  "/suspended",
  "/apply",
  "/fiyat",
  "/onay",
];
const STAFF_PREFIXES = ["/lift", "/parts", "/tasks"];
const STAFF_COOKIE = "sd_staff";

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((path) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

function isStaffPath(pathname: string) {
  return STAFF_PREFIXES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname } = request.nextUrl;

  if (!url || !anonKey) {
    if (!isPublicPath(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const staffToken = request.cookies.get(STAFF_COOKIE)?.value;
  const hasStaff = Boolean(staffToken && staffToken.length >= 16);

  if (!user && !isPublicPath(pathname)) {
    if (isStaffPath(pathname) && hasStaff) {
      return supabaseResponse;
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = isStaffPath(pathname) ? "/pin" : "/login";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
