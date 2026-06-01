/**
 * GET /api/agent/user/profile
 *
 * Returns the authenticated user's profile.
 *
 * Authentication: Supabase user session via Bearer token (from agent) OR
 * cookies (from browser). RLS is irrelevant here since we only read the
 * authenticated user's own row.
 *
 * Response shape:
 *   {
 *     user_id: string,
 *     first_name: string | null,
 *     email: string,
 *     timezone: string | null,
 *     onboarded_at: string | null,
 *     preferences: { communication_style?: string, preferred_contact_time?: string }
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  // ─────────────────────────────────────────────────────────────
  // Resolve authentication — bearer token (agent) or cookies (browser)
  // ─────────────────────────────────────────────────────────────

  const authHeader = req.headers.get("authorization");
  const bearerToken =
    authHeader?.startsWith("Bearer ") && authHeader.length > "Bearer ".length
      ? authHeader.slice("Bearer ".length).trim()
      : null;

  const supabase = bearerToken
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${bearerToken}` } },
          auth: { autoRefreshToken: false, persistSession: false },
        },
      )
    : await createServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ─────────────────────────────────────────────────────────────
  // Fetch profile from public.users
  // ─────────────────────────────────────────────────────────────

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, email, name, timezone, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("[agent-user-profile] Profile not found:", profileError);
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Fetch preferences if user_profile_prefs exists
  // We do this as a separate query because not all users have prefs.
  const { data: prefs } = await supabase
    .from("user_profile_prefs")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    user_id: profile.id,
    first_name: profile.name?.split(" ")[0] ?? null,
    email: profile.email,
    timezone: profile.timezone,
    onboarded_at: profile.onboarding_completed_at,
    preferences: prefs ?? {},
  });
}
