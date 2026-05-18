import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

/** Supabase sometimes lands on Site URL root with ?code= instead of /auth/callback. */
export function redirectAuthCodeToCallback(
  request: NextRequest
): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl;
  if (!searchParams.get("code") || pathname.startsWith("/auth/callback")) {
    return null;
  }
  const url = request.nextUrl.clone();
  url.pathname = "/auth/callback";
  // Keep ?code= and ?next= (Supabase may land on Site URL root without /auth/callback).
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser();

  return supabaseResponse;
}
