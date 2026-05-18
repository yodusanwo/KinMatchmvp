import { type NextRequest } from "next/server";
import {
  redirectAuthCodeToCallback,
  updateSession,
} from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const authRedirect = redirectAuthCodeToCallback(request);
  if (authRedirect) return authRedirect;
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
