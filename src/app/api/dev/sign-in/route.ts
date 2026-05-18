import { getAppOrigin, isDevAuthBypassEnabled } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRouteHandlerClientFromCookies } from "@/lib/supabase/route-handler";
import { NextResponse } from "next/server";

/**
 * Pilot/testing: sign in without sending email (bypasses OTP rate limits).
 * Uses admin generateLink + verifyOtp so the session is set on this site directly.
 */
export async function POST(request: Request) {
  if (!isDevAuthBypassEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  let body: { email?: string; next?: string; origin?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const next = body.next ?? "/today";
  const appOrigin = getAppOrigin();
  const redirectOrigin =
    body.origin && (body.origin === appOrigin || body.origin.includes("localhost"))
      ? body.origin.replace(/\/$/, "")
      : appOrigin;
  const redirectTo = `${redirectOrigin}/auth/callback?next=${encodeURIComponent(next)}`;

  const admin = createAdminClient();
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  const tokenHash = linkData.properties?.hashed_token;
  if (!tokenHash) {
    return NextResponse.json(
      { error: "Could not generate sign-in token" },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ ok: true, next });
  const supabase = await createRouteHandlerClientFromCookies(response);

  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "email",
    token_hash: tokenHash,
  });

  if (verifyError) {
    return NextResponse.json({ error: verifyError.message }, { status: 500 });
  }

  return response;
}
