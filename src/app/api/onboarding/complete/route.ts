import { createClient } from "@/lib/supabase/server";
import type { CompleteOnboardingPayload } from "@/lib/onboarding/api-types";
import { normalizeName } from "@/lib/onboarding/person-utils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed_at) {
    return NextResponse.json({ success: true, alreadyCompleted: true });
  }

  let body: CompleteOnboardingPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { q1People, q2People, q3Barriers, watchers } = body;

  if (!Array.isArray(q1People) || q1People.length === 0) {
    return NextResponse.json(
      { error: "At least one connection is required" },
      { status: 400 }
    );
  }

  const wishedCloserNames = new Set(
    q2People.map((p) => normalizeName(p.name))
  );

  const chipIdToFriendId = new Map<string, string>();

  for (const person of q1People) {
    const { data: friend, error: friendError } = await supabase
      .from("friends")
      .insert({
        user_id: user.id,
        name: person.name,
        avatar_color: person.avatarColor,
        vibe: "potential_close",
        is_wished_closer: wishedCloserNames.has(normalizeName(person.name)),
        in_tribe: true,
      })
      .select("id")
      .single();

    if (friendError || !friend) {
      return NextResponse.json(
        { error: friendError?.message ?? "Failed to save connection" },
        { status: 500 }
      );
    }

    chipIdToFriendId.set(person.id, friend.id);
  }

  if (Array.isArray(q3Barriers) && q3Barriers.length > 0) {
    const { error: barriersError } = await supabase
      .from("reflection_barriers")
      .insert(
        q3Barriers.map((barrier) => ({
          user_id: user.id,
          barrier,
        }))
      );

    if (barriersError) {
      return NextResponse.json({ error: barriersError.message }, { status: 500 });
    }
  }

  if (Array.isArray(watchers) && watchers.length > 0) {
    const heldRows = watchers
      .slice(0, 2)
      .map((chipId) => chipIdToFriendId.get(chipId))
      .filter((id): id is string => Boolean(id))
      .map((held_friend_id) => ({
        holder_user_id: user.id,
        held_friend_id,
        status: "active" as const,
      }));

    if (heldRows.length > 0) {
      const { error: heldError } = await supabase
        .from("held_relationships")
        .insert(heldRows);

      if (heldError) {
        return NextResponse.json({ error: heldError.message }, { status: 500 });
      }
    }
  }

  const { error: userError } = await supabase
    .from("users")
    .update({
      onboarding_completed_at: new Date().toISOString(),
      email: user.email ?? undefined,
    })
    .eq("id", user.id);

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
