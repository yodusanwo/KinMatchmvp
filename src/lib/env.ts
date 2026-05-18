/** Supabase URL and anon/publishable key (client-safe). */
export function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  return url;
}

export function getSupabaseAnonKey() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  }
  return key;
}

export function getAppOrigin(fallback = "http://localhost:3000") {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return fallback;
}

/**
 * Pilot/testing only: skip Supabase email OTP rate limits via admin generateLink.
 * Set NEXT_PUBLIC_DEV_AUTH_BYPASS=true in .env.local or Vercel, then redeploy.
 * Remove before a public launch.
 */
export function isDevAuthBypassEnabled() {
  return process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";
}

export function hasVercelBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function hasKlaviyo() {
  return Boolean(process.env.KLAVIYO_PRIVATE_API_KEY);
}

export function hasAnthropic() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
