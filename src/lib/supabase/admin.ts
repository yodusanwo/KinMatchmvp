import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/env";

/** Server-only Supabase client (bypasses RLS). Uses secret/service key. */
export function createAdminClient() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY for server uploads"
    );
  }

  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
