/**
 * GET /api/agent/user/rituals
 *
 * Returns the authenticated user's active rituals with participant friends
 * and overdue status, for use by the relational care agent.
 *
 * A ritual is considered "overdue" when:
 *   - status is "active"
 *   - next_date is in the past
 *
 * Authentication: Bearer token (agent) or cookies (browser).
 * RLS enforces user_id = auth.uid().
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type RitualRow = {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  next_date: string | null;
  status: "active" | "paused" | "archived";
  ritual_participants?: {
    friends: { id: string; name: string } | { id: string; name: string }[] | null;
  }[];
};

export async function GET(req: NextRequest) {
  // Resolve auth (same pattern as /api/agent/user/tribe)
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

  // Fetch active rituals with their participants
  const { data: ritualsData, error: ritualsError } = await supabase
    .from("rituals")
    .select(
      `
      id,
      name,
      description,
      frequency,
      next_date,
      status,
      ritual_participants(friends(id, name))
      `,
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .is("archived_at", null)
    .order("next_date", { ascending: true, nullsFirst: false });

  if (ritualsError) {
    console.error("[agent-user-rituals] Rituals query failed:", ritualsError);
    return NextResponse.json({ error: ritualsError.message }, { status: 500 });
  }

  // Map to the shape the agent expects
  const now = new Date();
  const rituals = ((ritualsData ?? []) as unknown as RitualRow[]).map((row) => {
    // Flatten participants (Supabase returns either an object or an array depending on relationship cardinality)
    const friendIds = (row.ritual_participants ?? [])
      .flatMap((p) => {
        if (!p.friends) return [];
        return Array.isArray(p.friends) ? p.friends : [p.friends];
      })
      .map((f) => f.id);

    const friendNames = (row.ritual_participants ?? [])
      .flatMap((p) => {
        if (!p.friends) return [];
        return Array.isArray(p.friends) ? p.friends : [p.friends];
      })
      .map((f) => f.name);

    // Overdue: next_date is in the past
    const isOverdue =
      row.next_date !== null && new Date(row.next_date) < now;

    return {
      ritual_id: row.id,
      name: row.name,
      description: row.description,
      frequency: row.frequency,
      next_date: row.next_date,
      status: row.status,
      friend_ids: friendIds,
      friend_names: friendNames,
      is_overdue: isOverdue,
    };
  });

  const overdueCount = rituals.filter((r) => r.is_overdue).length;

  return NextResponse.json({
    rituals,
    overdue_count: overdueCount,
    total_count: rituals.length,
  });
}
