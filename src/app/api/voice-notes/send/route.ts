import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/env";
import { uploadVoiceAudio } from "@/lib/voice-notes/storage";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const audioFile = formData.get("audio");
  const friendId = formData.get("friend_id");
  const durationRaw = formData.get("duration");
  const mimeTypeRaw = formData.get("mime_type");
  const peaksRaw = formData.get("peaks");

  if (!(audioFile instanceof Blob) || typeof friendId !== "string") {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const durationSeconds = Number.parseInt(String(durationRaw ?? "0"), 10);
  const mimeType =
    typeof mimeTypeRaw === "string" && mimeTypeRaw.trim()
      ? mimeTypeRaw.trim()
      : audioFile.type || "audio/webm";

  if (!Number.isFinite(durationSeconds) || durationSeconds < 1) {
    return NextResponse.json(
      { error: "duration must be at least 1 second" },
      { status: 400 }
    );
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

  const { data: discoveryPrompt } = await supabase
    .from("discovery_prompts")
    .select("id")
    .eq("user_id", user.id)
    .eq("friend_id", friendId)
    .is("interaction_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let peaks: number[] = [];
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

  const shareToken = randomBytes(18).toString("base64url");
  const audioUrl = await uploadVoiceAudio(
    user.id,
    shareToken,
    audioFile,
    mimeType
  );

  const { data: voiceNote, error: vnError } = await supabase
    .from("voice_notes")
    .insert({
      share_token: shareToken,
      sender_user_id: user.id,
      sender_id: user.id,
      recipient_friend_id: friendId,
      friend_id: friendId,
      audio_url: audioUrl,
      duration_seconds: durationSeconds,
      waveform_peaks: peaks,
      mime_type: mimeType,
      transcript_status: "pending",
      capture_pending: true,
      discovery_prompt_id: discoveryPrompt?.id ?? null,
    })
    .select("id, share_token, duration_seconds, audio_url, created_at")
    .single();

  if (vnError || !voiceNote) {
    return NextResponse.json(
      { error: vnError?.message ?? "Could not save voice note" },
      { status: 500 }
    );
  }

  const nowDate = new Date();
  const now = nowDate.toISOString();
  const capturePromptDueAt = new Date(
    nowDate.getTime() + 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: interaction } = await supabase
    .from("interactions")
    .insert({
      user_id: user.id,
      friend_id: friendId,
      type: "voice_note_sent",
      mode: "voice_note",
      direction: "outbound",
      voice_note_id: voiceNote.id,
      occurred_at: now,
      capture_prompt_due_at: capturePromptDueAt,
    })
    .select("id")
    .single();

  if (interaction) {
    if (discoveryPrompt) {
      await supabase
        .from("discovery_prompts")
        .update({ interaction_id: interaction.id })
        .eq("id", discoveryPrompt.id)
        .eq("user_id", user.id);
    }
  }

  await supabase
    .from("friends")
    .update({ last_touch_at: now })
    .eq("id", friendId)
    .eq("user_id", user.id);

  const publicUrl = `${getAppOrigin()}/v/${shareToken}`;

  return NextResponse.json({
    voice_note: voiceNote,
    public_url: publicUrl,
    friend_name: friend.name,
  });
}
