import { createClient } from "@/lib/supabase/server";
import { uploadVoiceAudio } from "@/lib/voice-notes/storage";
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
    .select("id, sender_user_id, recipient_friend_id, share_token")
    .eq("id", id)
    .eq("sender_user_id", user.id)
    .maybeSingle();

  if (!voiceNote) {
    return NextResponse.json({ error: "Voice note not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const audio = formData.get("audio");

  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
  }

  const durationRaw = formData.get("duration_seconds");
  const durationSeconds = Number(durationRaw);
  if (!Number.isFinite(durationSeconds) || durationSeconds < 1) {
    return NextResponse.json(
      { error: "duration_seconds must be at least 1" },
      { status: 400 }
    );
  }

  let peaks: number[] = [];
  const peaksRaw = formData.get("peaks");
  if (typeof peaksRaw === "string") {
    try {
      const parsed = JSON.parse(peaksRaw) as unknown;
      if (Array.isArray(parsed)) {
        peaks = parsed
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value))
          .slice(0, 30);
      }
    } catch {
      peaks = [];
    }
  }

  if (peaks.length === 0) {
    peaks = Array.from({ length: 30 }, () => 0.1);
  }

  const contentType = audio.type || "audio/webm";

  let audioUrl: string;
  try {
    audioUrl = await uploadVoiceAudio(
      user.id,
      voiceNote.id,
      audio,
      contentType
    );
  } catch (uploadError) {
    const message =
      uploadError instanceof Error ? uploadError.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("voice_notes")
    .update({
      audio_url: audioUrl,
      duration_seconds: Math.round(durationSeconds),
      waveform_peaks: peaks,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    id,
    audio_url: audioUrl,
    duration_seconds: Math.round(durationSeconds),
  });
}
