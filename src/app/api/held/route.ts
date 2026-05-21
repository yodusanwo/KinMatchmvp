import { sendHeldInvitationEmail } from "@/lib/klaviyo/send-held-invitation";
import { createClient } from "@/lib/supabase/server";
import type {
  HeldByUserEntry,
  HeldFriendEntry,
  HeldRelationshipStatus,
  HeldRecentEvent,
  HeldResponse,
} from "@/lib/api/held";
import { daysQuiet } from "@/lib/friends/utils";
import type { AvatarColor } from "@/lib/onboarding/types";
import { NextRequest, NextResponse } from "next/server";

const MAX_WATCHERS = 5;

type FriendLite = {
  id: string;
  name: string;
  email: string | null;
  avatar_color: AvatarColor;
  last_touch_at: string | null;
  created_at: string;
  archived_at?: string | null;
};

function firstOrNull<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizeStatus(
  status: string | null
): HeldRelationshipStatus {
  if (status === "accepted" || status === "declined") return status;
  return "pending";
}

/**
 * Pilot Held semantics:
 * - Onboarding selections mean "these friends hold the current user."
 * - The existing table stores those rows as holder_user_id=current user +
 *   held_friend_id=friend because non-user friends cannot be holder_user_id yet.
 * - Product language should treat those friends as accountability partners.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: holdingRows, error: holdingError } = await supabase
    .from("held_relationships")
    .select(
      `
      id,
      threshold_days,
      setup_notified_at,
      setup_notification_error,
      invited_at,
      accepted_at,
      archived_at,
      last_notified_at,
      status,
      held_friend_id,
      friend_id,
      friends:friends!held_relationships_held_friend_id_fkey (
        id,
        name,
        email,
        avatar_color,
        last_touch_at,
        created_at,
        archived_at
      )
    `
    )
    .eq("holder_user_id", user.id)
    .is("archived_at", null)
    .not("held_friend_id", "is", null)
    .order("created_at", { ascending: true });

  if (holdingError) {
    return NextResponse.json({ error: holdingError.message }, { status: 500 });
  }

  const activeAcceptedRows = (holdingRows ?? []).filter(
    (row) => row.status === "active"
  );
  if (activeAcceptedRows.length > 0) {
    await supabase
      .from("held_relationships")
      .update({ status: "accepted" })
      .in(
        "id",
        activeAcceptedRows.map((row) => row.id)
      );
  }

  const holding = (holdingRows ?? [])
    .map<HeldFriendEntry | null>((row) => {
      const friendRaw = row.friends as FriendLite | FriendLite[] | null;
      const friend = firstOrNull(friendRaw);

      if (!friend || friend.archived_at) return null;

      const quiet = daysQuiet(friend);
      const threshold = row.threshold_days;

      return {
        relationship_id: row.id,
        friend_id: friend.id,
        name: friend.name,
        email: friend.email,
        avatar_color: friend.avatar_color,
        days_quiet: quiet,
        threshold_days: threshold,
        invited_at: row.invited_at ?? row.setup_notified_at ?? new Date().toISOString(),
        accepted_at: row.accepted_at,
        archived_at: row.archived_at,
        last_notified_at: row.last_notified_at,
        setup_notified_at: row.setup_notified_at,
        setup_notification_error: row.setup_notification_error,
        status: normalizeStatus(row.status),
        at_threshold: quiet >= threshold,
      };
    })
    .filter((entry): entry is HeldFriendEntry => entry !== null);

  // People holding the current user (KinMatch accounts only; empty in most pilot cases)
  const { data: heldByMeRows, error: heldByMeError } = await supabase
    .from("held_relationships")
    .select(
      `
      id,
      threshold_days,
      status,
      holder_user_id,
      users:holder_user_id ( name, email )
    `
    )
    .eq("held_user_id", user.id);

  if (heldByMeError) {
    return NextResponse.json({ error: heldByMeError.message }, { status: 500 });
  }

  const held_by: HeldByUserEntry[] = (heldByMeRows ?? [])
    .map((row) => {
      const holderRaw = row.users as
        | { name: string | null; email: string }
        | { name: string | null; email: string }[]
        | null;
      const holder = Array.isArray(holderRaw) ? holderRaw[0] : holderRaw;
      if (!holder) return null;
      const name =
        holder.name?.trim() || holder.email?.split("@")[0] || "Someone";
      return {
        relationship_id: row.id,
        name,
        threshold_days: row.threshold_days,
        status: row.status as "active" | "paused",
      };
    })
    .filter((entry): entry is HeldByUserEntry => entry !== null);

  const relationshipIds = holding.map((row) => row.relationship_id);

  let recent_events: HeldRecentEvent[] = [];

  if (relationshipIds.length > 0) {
    const { data: eventRows, error: eventsError } = await supabase
      .from("held_events")
      .select(
        `
        id,
        event_type,
        occurred_at,
        held_relationship_id,
        held_relationships (
          held_friend_id,
          friends:friends!held_relationships_held_friend_id_fkey ( name )
        )
      `
      )
      .in("held_relationship_id", relationshipIds)
      .order("occurred_at", { ascending: false })
      .limit(5);

    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    recent_events = (eventRows ?? []).map((row) => {
      const relRaw = row.held_relationships as
        | { friends: { name: string } | { name: string }[] | null }
        | { friends: { name: string } | { name: string }[] | null }[]
        | null;
      const rel = Array.isArray(relRaw) ? relRaw[0] : relRaw;
      const friendsRaw = rel?.friends;
      const friend = Array.isArray(friendsRaw) ? friendsRaw[0] : friendsRaw;
      return {
        id: row.id,
        event_type: row.event_type,
        occurred_at: row.occurred_at,
        friend_name: friend?.name ?? null,
      };
    });
  }

  const activeFriendIds = new Set(holding.map((entry) => entry.friend_id));
  const { data: eligibleRows } = await supabase
    .from("friends")
    .select("id, name, avatar_color")
    .eq("user_id", user.id)
    .eq("in_tribe", true)
    .is("archived_at", null)
    .order("name");

  const { data: profile } = await supabase
    .from("users")
    .select("held_quiet_threshold_days")
    .eq("id", user.id)
    .single();

  const payload: HeldResponse = {
    holding,
    held_by,
    recent_events,
    eligible_friends: ((eligibleRows ?? []) as {
      id: string;
      name: string;
      avatar_color: AvatarColor;
    }[]).filter((friend) => !activeFriendIds.has(friend.id)),
    quiet_threshold_days: profile?.held_quiet_threshold_days ?? 14,
    max_watchers: MAX_WATCHERS,
  };

  return NextResponse.json(payload);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { threshold_days?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const threshold = Number(body.threshold_days);
  if (!Number.isFinite(threshold) || threshold < 3 || threshold > 30) {
    return NextResponse.json(
      { error: "Quiet window must be between 3 and 30 days." },
      { status: 400 }
    );
  }

  const quietThreshold = Math.round(threshold);
  const { error } = await supabase
    .from("users")
    .update({ held_quiet_threshold_days: quietThreshold })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("held_relationships")
    .update({ threshold_days: quietThreshold })
    .eq("holder_user_id", user.id)
    .is("archived_at", null);

  return NextResponse.json({ quiet_threshold_days: quietThreshold });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { friend_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.friend_id !== "string") {
    return NextResponse.json({ error: "friend_id is required" }, { status: 400 });
  }

  const { data: activeRows } = await supabase
    .from("held_relationships")
    .select("id")
    .eq("holder_user_id", user.id)
    .is("archived_at", null);

  if ((activeRows ?? []).length >= MAX_WATCHERS) {
    return NextResponse.json({ error: "Your circle is full." }, { status: 400 });
  }

  const { data: friend } = await supabase
    .from("friends")
    .select("id, name, email, avatar_color")
    .eq("id", body.friend_id)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (!friend) {
    return NextResponse.json({ error: "Friend not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, held_quiet_threshold_days")
    .eq("id", user.id)
    .single();

  const now = new Date().toISOString();
  const threshold = profile?.held_quiet_threshold_days ?? 14;
  const setupMessage = `Hi ${friend.name} — I chose you as one of my holders in KinMatch. KinMatch helps me notice when I’ve gone quiet with people I care about. If I’m quiet for ${threshold} days, KinMatch will send you a gentle heads-up so you can nudge me to reconnect. You don’t need to do anything right now — this is just me inviting you into that little accountability loop.`;
  const { data: relationship, error } = await supabase
    .from("held_relationships")
    .insert({
      holder_user_id: user.id,
      held_friend_id: friend.id,
      user_id: user.id,
      friend_id: friend.id,
      status: "pending",
      threshold_days: threshold,
      invited_at: now,
    })
    .select("id")
    .single();

  if (error || !relationship) {
    return NextResponse.json(
      { error: error?.message ?? "Could not add this person." },
      { status: 500 }
    );
  }

  if (friend.email) {
    await sendHeldInvitationEmail({
      holderUserId: user.id,
      recipientEmail: friend.email,
      holderName: friend.name,
      userName: profile?.name?.trim() || profile?.email?.split("@")[0] || "Someone",
      thresholdDays: threshold,
      setupMessage,
    });
  }

  return NextResponse.json({ success: true, relationship_id: relationship.id }, { status: 201 });
}
