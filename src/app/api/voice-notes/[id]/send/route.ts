import { createClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/env";
import { sendVoiceNoteReceivedEmail } from "@/lib/klaviyo/send-voice-note-received";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: voiceNote } = await supabase
    .from("voice_notes")
    .select(
      "id, share_token, duration_seconds, audio_url, recipient_friend_id"
    )
    .eq("id", id)
    .eq("sender_user_id", user.id)
    .maybeSingle();

  if (!voiceNote) {
    return NextResponse.json({ error: "Voice note not found" }, { status: 404 });
  }

  if (voiceNote.audio_url === "pending") {
    return NextResponse.json(
      { error: "Upload the recording before sending" },
      { status: 400 }
    );
  }

  let body: { recipient_email?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { data: senderProfile } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .single();

  const senderName =
    senderProfile?.name?.trim() ||
    senderProfile?.email?.split("@")[0] ||
    "Someone";

  const listenUrl = `${getAppOrigin()}/v/${voiceNote.share_token}`;

  let emailResult: Awaited<ReturnType<typeof sendVoiceNoteReceivedEmail>> = {
    sent: false,
    skipped: true,
  };
  const recipientEmail = body.recipient_email?.trim();

  if (recipientEmail) {
    emailResult = await sendVoiceNoteReceivedEmail({
      recipientEmail,
      senderName,
      shareToken: voiceNote.share_token,
      durationSeconds: voiceNote.duration_seconds,
    });
  }

  return NextResponse.json({
    sent: emailResult.sent,
    skipped: emailResult.skipped,
    listen_url: listenUrl,
    error: emailResult.error,
  });
}
