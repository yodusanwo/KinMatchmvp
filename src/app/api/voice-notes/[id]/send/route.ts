import { createClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/env";
import { NextResponse } from "next/server";

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

  const listenUrl = `${getAppOrigin()}/v/${voiceNote.share_token}`;

  return NextResponse.json({
    sent: true,
    skipped: false,
    listen_url: listenUrl,
  });
}
