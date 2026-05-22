import { randomBytes } from "crypto";
import { formatPersonName } from "@/lib/names/format";
import { daysQuiet } from "@/lib/friends/utils";
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
    .select(
      "id, name, phone_number, category, cadence_days, last_touch_at, created_at"
    )
    .eq("id", friendId)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (!friend) {
    return NextResponse.json({ error: "Friend not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .maybeSingle();

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
  let audioUrl: string;
  try {
    audioUrl = await uploadVoiceAudio(
      user.id,
      shareToken,
      audioFile,
      mimeType
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save the voice note";
    return NextResponse.json({ error: message }, { status: 500 });
  }

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

  const publicUrl = `${getAppOrigin()}/v/${shareToken}`;

  const friendRow = friend as {
    id: string;
    name: string;
    phone_number: string | null;
    category: string;
    cadence_days: number;
    last_touch_at: string | null;
    created_at: string;
  };

  return NextResponse.json({
    voice_note: voiceNote,
    public_url: publicUrl,
    share_token: shareToken,
    friend_name: formatPersonName(friendRow.name),
    friend_phone_number: friendRow.phone_number,
    friend_category: friendRow.category,
    friend_days_quiet: daysQuiet(friendRow),
    sender_name: profile?.name?.trim()
      ? formatPersonName(profile.name)
      : profile?.email?.split("@")[0] || null,
  });
}
