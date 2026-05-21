import { NextResponse } from "next/server";
import { sendHeldInvitationEmail } from "@/lib/klaviyo/send-held-invitation";
import { createClient } from "@/lib/supabase/server";

const MAX_WATCHERS = 5;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { friend_id?: unknown; setup_message?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.friend_id !== "string") {
    return NextResponse.json({ error: "friend_id is required" }, { status: 400 });
  }

  const setupMessage =
    typeof body.setup_message === "string" && body.setup_message.trim().length >= 20
      ? body.setup_message.trim().slice(0, 1200)
      : null;

  if (!setupMessage) {
    return NextResponse.json(
      { error: "Add a little more context before sending." },
      { status: 400 }
    );
  }

  const { data: activeRows } = await supabase
    .from("held_relationships")
    .select("id")
    .eq("holder_user_id", user.id)
    .is("archived_at", null);

  if ((activeRows ?? []).length >= MAX_WATCHERS) {
    return NextResponse.json({ error: "Your circle is full." }, { status: 400 });
  }

  const { data: existingActive } = await supabase
    .from("held_relationships")
    .select("id")
    .eq("holder_user_id", user.id)
    .eq("held_friend_id", body.friend_id)
    .is("archived_at", null)
    .maybeSingle();

  if (existingActive) {
    return NextResponse.json({ error: "Already in your circle." }, { status: 409 });
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
