import { type NextRequest } from "next/server";
import {
  redirectAuthCodeToCallback,
  redirectPilotInviteToken,
  updateSession,
} from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const pilotRedirect = redirectPilotInviteToken(request);
  if (pilotRedirect) return pilotRedirect;
  const authRedirect = redirectAuthCodeToCallback(request);
  if (authRedirect) return authRedirect;
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
