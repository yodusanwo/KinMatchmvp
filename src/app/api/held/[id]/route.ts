import { sendHeldSetupEmail } from "@/lib/klaviyo/send-held-setup";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

function cleanEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : null;
}

function cleanThreshold(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(30, Math.max(3, Math.round(number)));
}

function cleanSetupMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 20) return null;
  return trimmed.slice(0, 1200);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    threshold_days?: unknown;
    partner_email?: unknown;
    setup_message?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const thresholdDays =
    body.threshold_days === undefined ? null : cleanThreshold(body.threshold_days);
  const partnerEmail =
    body.partner_email === undefined ? undefined : cleanEmail(body.partner_email);
  const setupMessage =
    body.setup_message === undefined
      ? null
      : cleanSetupMessage(body.setup_message);

  if (body.threshold_days !== undefined && thresholdDays === null) {
    return NextResponse.json(
      { error: "Quiet window must be between 3 and 30 days." },
      { status: 400 }
    );
  }

  if (body.partner_email !== undefined && partnerEmail === null) {
    return NextResponse.json(
      { error: "Enter a valid accountability partner email." },
      { status: 400 }
    );
  }

  if (body.setup_message !== undefined && setupMessage === null) {
    return NextResponse.json(
      { error: "Add a little more context before sending." },
      { status: 400 }
    );
  }

  const { data: relationship, error: relationshipError } = await supabase
    .from("held_relationships")
    .select(
      `
      id,
      threshold_days,
      setup_notified_at,
      held_friend_id,
      friends(id, name, email),
      users:holder_user_id(name, email)
      `
    )
    .eq("id", id)
    .eq("holder_user_id", user.id)
    .maybeSingle();

  if (relationshipError) {
    return NextResponse.json({ error: relationshipError.message }, { status: 500 });
  }

  if (!relationship?.held_friend_id) {
    return NextResponse.json({ error: "Held relationship not found" }, { status: 404 });
  }

  if (thresholdDays !== null) {
    const { error } = await supabase
      .from("held_relationships")
      .update({ threshold_days: thresholdDays })
      .eq("id", id)
      .eq("holder_user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const friendRaw = relationship.friends as
    | { id: string; name: string; email: string | null }
    | { id: string; name: string; email: string | null }[]
    | null;
  const friend = Array.isArray(friendRaw) ? friendRaw[0] : friendRaw;

  const userRaw = relationship.users as
    | { name: string | null; email: string | null }
    | { name: string | null; email: string | null }[]
    | null;
  const profile = Array.isArray(userRaw) ? userRaw[0] : userRaw;

  if (partnerEmail !== undefined && friend) {
    const notificationEmail = partnerEmail;
    if (!notificationEmail) {
      return NextResponse.json(
        { error: "Enter a valid accountability partner email." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("friends")
      .update({ email: notificationEmail })
      .eq("id", friend.id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const quietWindow = thresholdDays ?? relationship.threshold_days;
    const result = await sendHeldSetupEmail({
      holderUserId: user.id,
      recipientEmail: notificationEmail,
      holderName: friend.name,
      userName: profile?.name?.trim() || profile?.email?.split("@")[0] || "Someone",
      thresholdDays: quietWindow,
      setupMessage:
        setupMessage ??
        `Hi ${friend.name} — I chose you as one of my holders in KinMatch. KinMatch helps me notice when I’ve gone quiet with people I care about. If I’m quiet for ${quietWindow} days, KinMatch will send you a gentle heads-up so you can nudge me to reconnect. You don’t need to do anything right now — this is just me inviting you into that little accountability loop.`,
    });

    await supabase
      .from("held_relationships")
      .update({
        setup_notified_at: result.sent ? new Date().toISOString() : null,
        setup_notification_error: result.error ?? null,
      })
      .eq("id", id)
      .eq("holder_user_id", user.id);
  }

  return NextResponse.json({ success: true });
}
