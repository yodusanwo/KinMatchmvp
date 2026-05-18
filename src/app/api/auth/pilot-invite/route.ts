import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Pilot waitlist: exchange invitation magic-link token for a session, then
 * continue into onboarding. Klaviyo links use /onboarding?token=xxx (token_hash).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token =
    searchParams.get("token") ?? searchParams.get("token_hash");
  const next = searchParams.get("next") ?? "/onboarding";
  const otpType =
    searchParams.get("type") === "invite" ? "invite" : "email";

  if (!token) {
    return NextResponse.redirect(
      new URL("/signin?error=missing_token", request.url)
    );
  }

  const destination = new URL(next, request.url);
  destination.searchParams.delete("token");
  destination.searchParams.delete("token_hash");
  destination.searchParams.delete("type");

  const response = NextResponse.redirect(destination);
  const supabase = createRouteHandlerClient(request, response);

  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: otpType,
  });

  if (error) {
    const signin = new URL("/signin", request.url);
    signin.searchParams.set("error", "auth");
    signin.searchParams.set("next", next);
    return NextResponse.redirect(signin);
  }

  return response;
}
