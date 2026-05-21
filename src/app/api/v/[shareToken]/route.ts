import { createAdminClient } from "@/lib/supabase/admin";
import type { PublicVoiceNote } from "@/lib/api/public-voice-note";
import { avatarColorFromUserId } from "@/lib/voice-notes/avatar-from-user";
import { listenPageAudioUrl } from "@/lib/voice-notes/blob-url";
import type { AvatarColor } from "@/lib/onboarding/types";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ shareToken: string }> };

function normalizePeaks(raw: unknown): number[] {
  if (!Array.isArray(raw)) {
    return Array.from({ length: 30 }, () => 0.1);
  }
  const peaks = raw
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .slice(0, 30);
  if (peaks.length === 0) {
    return Array.from({ length: 30 }, () => 0.1);
  }
  while (peaks.length < 30) {
    peaks.push(peaks[peaks.length - 1] ?? 0.1);
  }
  return peaks;
}

export async function GET(_request: Request, context: RouteContext) {
  const { shareToken } = await context.params;

  if (!shareToken || shareToken.length < 8) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = createAdminClient();

  const { data: voiceNote, error } = await admin
    .from("voice_notes")
    .select(
      "audio_url, duration_seconds, waveform_peaks, transcript, created_at, sender_user_id, sender_id, listened_at, listen_count"
    )
    .eq("share_token", shareToken)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!voiceNote || voiceNote.audio_url === "pending") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: sender } = await admin
    .from("users")
    .select("name, email")
    .eq("id", voiceNote.sender_id ?? voiceNote.sender_user_id)
    .maybeSingle();

  const senderName =
    sender?.name?.trim() ||
    sender?.email?.split("@")[0] ||
    "Someone";

  await admin
    .from("voice_notes")
    .update({
      listened_at: voiceNote.listened_at ?? new Date().toISOString(),
      listen_count: (voiceNote.listen_count ?? 0) + 1,
    })
    .eq("share_token", shareToken);

  const payload: PublicVoiceNote = {
    sender_name: senderName,
    sender_avatar_color: avatarColorFromUserId(
      voiceNote.sender_id ?? voiceNote.sender_user_id
    ) as AvatarColor,
    audio_url: listenPageAudioUrl(shareToken, voiceNote.audio_url),
    duration_seconds: voiceNote.duration_seconds,
    peaks: normalizePeaks(voiceNote.waveform_peaks),
    transcript: voiceNote.transcript,
    sent_at: voiceNote.created_at,
  };

  return NextResponse.json(payload);
}
