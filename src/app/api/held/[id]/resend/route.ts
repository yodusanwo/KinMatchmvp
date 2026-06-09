import { NextResponse } from "next/server";
import { sendHeldInvitationEmail } from "@/lib/klaviyo/send-held-invitation";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: relationship, error } = await supabase
    .from("held_relationships")
    .select(
      `
      id,
      threshold_days,
      friends:friends!held_relationships_held_friend_id_fkey(id, name, email, archived_at),
      users:holder_user_id(name, email)
      `
    )
    .eq("id", id)
    .eq("holder_user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const friendRaw = relationship?.friends as
    | { id: string; name: string; email: string | null; archived_at: string | null }
    | { id: string; name: string; email: string | null; archived_at: string | null }[]
    | null;
  const friend = Array.isArray(friendRaw) ? friendRaw[0] : friendRaw;

  if (!relationship || !friend || friend.archived_at) {
    return NextResponse.json({ error: "Held relationship not found" }, { status: 404 });
  }

  if (!friend.email) {
    return NextResponse.json({ error: "No email saved for this person." }, { status: 400 });
  }

  const userRaw = relationship.users as
    | { name: string | null; email: string | null }
    | { name: string | null; email: string | null }[]
    | null;
  const profile = Array.isArray(userRaw) ? userRaw[0] : userRaw;

  const result = await sendHeldInvitationEmail({
    holderUserId: user.id,
    recipientEmail: friend.email,
    holderName: friend.name,
    userName: profile?.name?.trim() || profile?.email?.split("@")[0] || "Someone",
    thresholdDays: relationship.threshold_days,
    setupMessage: `Hi ${friend.name}, I chose you as one of my holders in KinMatch. If I’m quiet for ${relationship.threshold_days} days, KinMatch will send you a gentle heads-up so you can nudge me to reconnect. You don’t need to do anything right now, this is just me inviting you into that little accountability loop.`,
  });

  await supabase
    .from("held_relationships")
    .update({
      invited_at: new Date().toISOString(),
      setup_notification_error: result.error ?? null,
    })
    .eq("id", id)
    .eq("holder_user_id", user.id);

  if (!result.sent && !result.skipped) {
    return NextResponse.json({ error: result.error ?? "Could not resend." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
