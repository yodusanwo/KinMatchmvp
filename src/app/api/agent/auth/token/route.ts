/**
 * POST /api/agent/auth/token
 *
 * Mints a Supabase user-scoped access token for the KinMatch Relational
 * Care Agent to call other KinMatch APIs on behalf of a specific user.
 *
 * Security model:
 *   1. Caller must present a valid agent secret (Authorization: Bearer)
 *   2. Caller must specify which user to act on (X-Acting-As-User header)
 *   3. The target user must exist in auth.users
 *   4. We use Supabase Admin API to mint a real session for that user
 *
 * The returned access_token is signed by Supabase itself, so all standard
 * RLS policies apply when the agent uses it to call other endpoints.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  // ─────────────────────────────────────────────────────────────
  // 1. Validate agent secret
  // ─────────────────────────────────────────────────────────────

  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.KINMATCH_AGENT_SECRET;

  if (!expectedSecret) {
    console.error("[agent-auth] KINMATCH_AGENT_SECRET not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or malformed Authorization header" },
      { status: 401 },
    );
  }

  const providedSecret = authHeader.slice("Bearer ".length).trim();

  if (!constantTimeEqual(providedSecret, expectedSecret)) {
    return NextResponse.json(
      { error: "Invalid agent secret" },
      { status: 401 },
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Validate target user header
  // ─────────────────────────────────────────────────────────────

  const targetUserId = req.headers.get("x-acting-as-user");

  if (!targetUserId) {
    return NextResponse.json(
      { error: "Missing X-Acting-As-User header" },
      { status: 400 },
    );
  }

  if (!isUuid(targetUserId)) {
    return NextResponse.json(
      { error: "X-Acting-As-User must be a valid UUID" },
      { status: 400 },
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Set up admin client
  // ─────────────────────────────────────────────────────────────

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("[agent-auth] Supabase URL or service key not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Verify the target user exists
  // ─────────────────────────────────────────────────────────────

  const { data: userResult, error: userError } =
    await adminClient.auth.admin.getUserById(targetUserId);

  if (userError || !userResult?.user) {
    console.warn("[agent-auth] Target user not found:", targetUserId);
    return NextResponse.json(
      { error: "Target user not found" },
      { status: 404 },
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Mint a session for the target user using admin generateLink
  //    + verifyOtp pattern. The returned access_token is signed by
  //    Supabase itself (works with HS256 and ECC P-256 projects).
  // ─────────────────────────────────────────────────────────────

  const { data: linkData, error: linkError } =
    await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: userResult.user.email!,
    });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("[agent-auth] Failed to generate session link:", linkError);
    return NextResponse.json(
      { error: "Failed to mint session token" },
      { status: 500 },
    );
  }

  // Exchange the hashed token for a real session
  const userClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: sessionData, error: sessionError } =
    await userClient.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    });

  if (sessionError || !sessionData?.session?.access_token) {
    console.error("[agent-auth] Failed to verify token:", sessionError);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }

  console.log(`[agent-auth] Minted session token for user ${targetUserId}`);

  return NextResponse.json({
    access_token: sessionData.session.access_token,
    expires_in: sessionData.session.expires_in ?? 3600,
    token_type: "Bearer",
    user_id: targetUserId,
  });
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s,
  );
}
