import { createClient } from "@/lib/supabase/server";
import type {
  HeldByUserEntry,
  HeldFriendEntry,
  HeldRecentEvent,
  HeldResponse,
} from "@/lib/api/held";
import { daysQuiet } from "@/lib/friends/utils";
import type { AvatarColor } from "@/lib/onboarding/types";
import { NextResponse } from "next/server";

/**
 * Pilot Held semantics (see onboarding/complete):
 * - Onboarding "who holds you" selections are stored as holder_user_id = current user,
 *   held_friend_id = friend. In product language that is "You're holding" — you watch
 *   these friends for quiet periods (alerts not automated yet in pilot).
 * - "Held by" is reserved for reciprocal KinMatch users (held_user_id = current user).
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
      status,
      held_friend_id,
      friends (
        id,
        name,
        avatar_color,
        last_touch_at,
        created_at
      )
    `
    )
    .eq("holder_user_id", user.id)
    .not("held_friend_id", "is", null)
    .order("created_at", { ascending: true });

  if (holdingError) {
    return NextResponse.json({ error: holdingError.message }, { status: 500 });
  }

  const holding: HeldFriendEntry[] = (holdingRows ?? [])
    .map((row) => {
      const friendRaw = row.friends as
        | {
            id: string;
            name: string;
            avatar_color: AvatarColor;
            last_touch_at: string | null;
            created_at: string;
          }
        | {
            id: string;
            name: string;
            avatar_color: AvatarColor;
            last_touch_at: string | null;
            created_at: string;
          }[]
        | null;

      const friend = Array.isArray(friendRaw) ? friendRaw[0] : friendRaw;

      if (!friend) return null;

      const quiet = daysQuiet(friend);
      const threshold = row.threshold_days;

      return {
        relationship_id: row.id,
        friend_id: friend.id,
        name: friend.name,
        avatar_color: friend.avatar_color,
        days_quiet: quiet,
        threshold_days: threshold,
        status: row.status as "active" | "paused",
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

  const relationshipIds = [
    ...(holdingRows ?? []).map((row) => row.id),
    ...(heldByMeRows ?? []).map((row) => row.id),
  ];

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
          friends ( name )
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

  const payload: HeldResponse = {
    holding,
    held_by,
    recent_events,
  };

  return NextResponse.json(payload);
}
