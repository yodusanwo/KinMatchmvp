import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { friend_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const friendId = body.friend_id;
  if (!friendId) {
    return NextResponse.json({ error: "friend_id is required" }, { status: 400 });
  }

  const { data: friend } = await supabase
    .from("friends")
    .select("id, name")
    .eq("id", friendId)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (!friend) {
    return NextResponse.json({ error: "Friend not found" }, { status: 404 });
  }

  const shareToken = randomUUID().replace(/-/g, "");

  const { data: voiceNote, error } = await supabase
    .from("voice_notes")
    .insert({
      sender_user_id: user.id,
      recipient_friend_id: friendId,
      audio_url: "pending",
      duration_seconds: 0,
      waveform_peaks: [],
      share_token: shareToken,
    })
    .select("id, share_token")
    .single();

  if (error || !voiceNote) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create voice note" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: voiceNote.id,
    share_token: voiceNote.share_token,
  });
}
