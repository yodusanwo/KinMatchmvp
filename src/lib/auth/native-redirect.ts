import { isNativePlatform } from "@/lib/audio/platform";

const APP_SCHEME =
  process.env.NEXT_PUBLIC_NATIVE_APP_SCHEME ?? "kinmatch";

/** OAuth/magic-link redirect origin for the current runtime. */
export function getAuthRedirectOrigin(webOrigin: string): string {
  if (typeof window === "undefined") {
    return webOrigin;
  }
  if (isNativePlatform()) {
    return `${APP_SCHEME}://`;
  }
  return webOrigin;
}

/** Add to Supabase Auth → URL Configuration → Redirect URLs. */
export function getNativeAuthCallbackUrl(): string {
  return `${APP_SCHEME}://auth/callback`;
}
