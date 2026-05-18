import { sendWelcomeEmail } from "@/lib/klaviyo/send-welcome-email";
import type { CompleteOnboardingPayload } from "@/lib/onboarding/api-types";
import type { BarrierId } from "@/lib/onboarding/types";
import { dedupePeopleByName, normalizeName } from "@/lib/onboarding/person-utils";
import { barrierIdsToKeys } from "@/lib/personalization";
import { createClient } from "@/lib/supabase/server";
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

  const q1People = dedupePeopleByName(
    Array.isArray(body.q1People) ? body.q1People : []
  );
  const q2People = dedupePeopleByName(
    Array.isArray(body.q2People) ? body.q2People : []
  );
  const q3Barriers = body.q3Barriers;
  const watchers = Array.isArray(body.watchers) ? body.watchers : [];

  if (q1People.length === 0) {
    return NextResponse.json(
      { error: "At least one connection is required" },
      { status: 400 }
    );
  }

  const barrierKeys =
    Array.isArray(q3Barriers) && q3Barriers.length > 0
      ? barrierIdsToKeys(q3Barriers as BarrierId[])
      : [];

  const completedAt = new Date().toISOString();

  // Atomic claim: only one in-flight save can proceed (double-click / parallel tabs).
  const { data: claimed, error: claimError } = await supabase
    .from("users")
    .update({
      onboarding_completed_at: completedAt,
      email: user.email ?? undefined,
    })
    .eq("id", user.id)
    .is("onboarding_completed_at", null)
    .select("id")
    .maybeSingle();

  if (claimError) {
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }

  if (!claimed) {
    return NextResponse.json({ success: true, alreadyCompleted: true });
  }

  try {
    await supabase
      .from("held_relationships")
      .delete()
      .eq("holder_user_id", user.id);
    await supabase.from("reflection_barriers").delete().eq("user_id", user.id);
    await supabase.from("friends").delete().eq("user_id", user.id);

    const wishedCloserNames = new Set(
      q2People.map((p) => normalizeName(p.name))
    );
    const chipIdToFriendId = new Map<string, string>();
    const q1NameSet = new Set(q1People.map((p) => normalizeName(p.name)));

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
        throw new Error(friendError?.message ?? "Failed to save connection");
      }

      chipIdToFriendId.set(person.id, friend.id);
    }

    for (const person of q2People) {
      if (q1NameSet.has(normalizeName(person.name))) continue;

      const { data: friend, error: friendError } = await supabase
        .from("friends")
        .insert({
          user_id: user.id,
          name: person.name,
          avatar_color: person.avatarColor,
          vibe: "potential_close",
          is_wished_closer: true,
          in_tribe: true,
        })
        .select("id")
        .single();

      if (friendError || !friend) {
        throw new Error(friendError?.message ?? "Failed to save connection");
      }

      chipIdToFriendId.set(person.id, friend.id);
    }

    if (barrierKeys.length > 0) {
      const { error: barriersError } = await supabase
        .from("reflection_barriers")
        .insert(
          q3Barriers.map((barrier) => ({
            user_id: user.id,
            barrier,
          }))
        );

      if (barriersError) {
        throw new Error(barriersError.message);
      }
    }

    if (watchers.length > 0) {
      const heldFriendIds = new Set<string>();
      const heldRows: {
        holder_user_id: string;
        held_friend_id: string;
        status: "active";
      }[] = [];

      for (const chipId of watchers.slice(0, 2)) {
        const held_friend_id = chipIdToFriendId.get(chipId);
        if (!held_friend_id || heldFriendIds.has(held_friend_id)) continue;
        heldFriendIds.add(held_friend_id);
        heldRows.push({
          holder_user_id: user.id,
          held_friend_id,
          status: "active",
        });
      }

      if (heldRows.length > 0) {
        const { error: heldError } = await supabase
          .from("held_relationships")
          .insert(heldRows);

        if (heldError) {
          throw new Error(heldError.message);
        }
      }
    }

    const { error: barriersUpdateError } = await supabase
      .from("users")
      .update({ barriers: barrierKeys })
      .eq("id", user.id);

    if (barriersUpdateError) {
      throw new Error(barriersUpdateError.message);
    }

    if (user.email) {
      const { data: profileRow } = await supabase
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single();

      await sendWelcomeEmail({
        email: user.email,
        firstName: profileRow?.name ?? null,
        user: { barriers: barrierKeys },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    await supabase
      .from("users")
      .update({ onboarding_completed_at: null })
      .eq("id", user.id)
      .eq("onboarding_completed_at", completedAt);

    const message =
      err instanceof Error ? err.message : "Could not save your people.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
