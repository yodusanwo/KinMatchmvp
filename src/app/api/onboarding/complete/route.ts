import { formatPersonName } from "@/lib/names/format";
import { normalizePhone } from "@/lib/phones/normalize";
import { sendWelcomeEmail } from "@/lib/klaviyo/send-welcome-email";
import type { CompleteOnboardingPayload } from "@/lib/onboarding/api-types";
import type { BarrierId, CircleId } from "@/lib/onboarding/types";
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
    .select("name, onboarding_completed_at")
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
  const rawUserName = profile?.name?.trim() || body.userName?.trim();
  const userName = rawUserName ? formatPersonName(rawUserName) : "";
  const q2People = dedupePeopleByName(
    Array.isArray(body.q2People) ? body.q2People : []
  );
  const circleAssignments =
    body.circleAssignments && typeof body.circleAssignments === "object"
      ? (body.circleAssignments as Record<string, CircleId>)
      : null;
  const innerCirclePeople = circleAssignments
    ? q1People.filter((person) => circleAssignments[person.id] === "inner")
    : q1People;
  const villagePeople = circleAssignments
    ? q1People.filter((person) => circleAssignments[person.id] === "village")
    : q2People;
  const familyPeople = circleAssignments
    ? q1People.filter((person) => circleAssignments[person.id] === "family")
    : [];
  const acquaintancePeople = circleAssignments
    ? q1People.filter((person) => circleAssignments[person.id] === "acquaintance")
    : [];
  const q3Barriers = body.q3Barriers;
  const watchers = Array.isArray(body.watchers) ? body.watchers : [];

  if (!userName || userName.length < 2) {
    return NextResponse.json(
      { error: "Enter your name before starting onboarding." },
      { status: 400 }
    );
  }

  if (innerCirclePeople.length === 0) {
    return NextResponse.json(
      { error: "At least one inner-circle connection is required" },
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
      discovery_started_at: completedAt,
      discovery_completed_at: null,
      email: user.email ?? undefined,
      name: userName,
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

    const chipIdToFriendId = new Map<string, string>();
    const innerNameSet = new Set(
      innerCirclePeople.map((p) => normalizeName(p.name))
    );
    const villageNameSet = new Set(
      villagePeople.map((p) => normalizeName(p.name))
    );
    const familyNameSet = new Set(
      familyPeople.map((p) => normalizeName(p.name))
    );

    for (const person of innerCirclePeople) {
      const { data: friend, error: friendError } = await supabase
        .from("friends")
        .insert({
          user_id: user.id,
          name: formatPersonName(person.name),
          phone_number: person.phone_number
            ? normalizePhone(person.phone_number)
            : null,
          avatar_color: person.avatarColor,
          vibe: "potential_close",
          category: "inner_circle",
          cadence_days: 14,
          is_wished_closer: false,
          in_tribe: true,
        })
        .select("id")
        .single();

      if (friendError || !friend) {
        throw new Error(friendError?.message ?? "Failed to save connection");
      }

      chipIdToFriendId.set(person.id, friend.id);
    }

    for (const person of familyPeople) {
      if (innerNameSet.has(normalizeName(person.name))) continue;

      const { data: friend, error: friendError } = await supabase
        .from("friends")
        .insert({
          user_id: user.id,
          name: formatPersonName(person.name),
          phone_number: person.phone_number
            ? normalizePhone(person.phone_number)
            : null,
          avatar_color: person.avatarColor,
          vibe: "potential_close",
          category: "family",
          cadence_days: 21,
          is_wished_closer: false,
          in_tribe: true,
        })
        .select("id")
        .single();

      if (friendError || !friend) {
        throw new Error(friendError?.message ?? "Failed to save connection");
      }

      chipIdToFriendId.set(person.id, friend.id);
    }

    for (const person of acquaintancePeople) {
      if (innerNameSet.has(normalizeName(person.name)) || 
          villageNameSet.has(normalizeName(person.name)) ||
          familyNameSet.has(normalizeName(person.name))) continue;

      const { data: friend, error: friendError } = await supabase
        .from("friends")
        .insert({
          user_id: user.id,
          name: formatPersonName(person.name),
          phone_number: person.phone_number
            ? normalizePhone(person.phone_number)
            : null,
          avatar_color: person.avatarColor,
          vibe: "potential_close",
          category: "acquaintance",
          cadence_days: 60,
          is_wished_closer: false,
          in_tribe: true,
        })
        .select("id")
        .single();

      if (friendError || !friend) {
        throw new Error(friendError?.message ?? "Failed to save connection");
      }

      chipIdToFriendId.set(person.id, friend.id);
    }

    for (const person of villagePeople) {
      if (innerNameSet.has(normalizeName(person.name)) ||
          familyNameSet.has(normalizeName(person.name))) continue;

      const { data: friend, error: friendError } = await supabase
        .from("friends")
        .insert({
          user_id: user.id,
          name: formatPersonName(person.name),
          phone_number: person.phone_number
            ? normalizePhone(person.phone_number)
            : null,
          avatar_color: person.avatarColor,
          vibe: "potential_close",
          category: "village",
          cadence_days: 30,
          is_wished_closer: false,
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
        threshold_days: number;
        status: "active";
      }[] = [];

      for (const chipId of watchers.slice(0, 2)) {
        const held_friend_id = chipIdToFriendId.get(chipId);
        if (!held_friend_id || heldFriendIds.has(held_friend_id)) continue;
        heldFriendIds.add(held_friend_id);
        heldRows.push({
          holder_user_id: user.id,
          held_friend_id,
          threshold_days: 14,
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
