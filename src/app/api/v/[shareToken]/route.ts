import { createAdminClient } from "@/lib/supabase/admin";
import { fetchPublicVoiceNote } from "@/lib/voice-notes/public-voice-note";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ shareToken: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { shareToken } = await context.params;
  const { data: voiceNote, error } = await fetchPublicVoiceNote(shareToken);

  if (!voiceNote) {
    return NextResponse.json(
      { error: error ?? "Not found" },
      { status: error === "Not found" ? 404 : 500 }
    );
  }

  const admin = createAdminClient();
  await admin
    .from("voice_notes")
    .update({
      listened_at: voiceNote.listened_at ?? new Date().toISOString(),
      listen_count: (voiceNote.listen_count ?? 0) + 1,
    })
    .eq("share_token", voiceNote.share_token);

  return NextResponse.json({
    sender_name: voiceNote.sender_name,
    sender_avatar_color: voiceNote.sender_avatar_color,
    audio_url: voiceNote.audio_url,
    duration_seconds: voiceNote.duration_seconds,
    peaks: voiceNote.peaks,
    transcript: voiceNote.transcript,
    sent_at: voiceNote.sent_at,
  });
}
