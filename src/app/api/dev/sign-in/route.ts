import { getAppOrigin, isDevAuthBypassEnabled } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Dev-only: create a magic-link URL without sending email (bypasses OTP rate limits).
 * Set NEXT_PUBLIC_DEV_AUTH_BYPASS=true in .env.local.
 */
export async function POST(request: Request) {
  if (!isDevAuthBypassEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  let body: { email?: string; next?: string };
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
  const redirectTo = `${getAppOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const url = data.properties?.action_link;
  if (!url) {
    return NextResponse.json(
      { error: "Could not generate sign-in link" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url });
}
