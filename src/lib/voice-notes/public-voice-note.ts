import { formatPersonName } from "@/lib/names/format";
import { firstName as firstNameFromFull } from "@/lib/memories/categories";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PublicVoiceNote } from "@/lib/api/public-voice-note";
import type { AvatarColor } from "@/lib/onboarding/types";
import { avatarColorFromUserId } from "@/lib/voice-notes/avatar-from-user";
import {
  listenPageAudioUrl,
  normalizeShareToken,
} from "@/lib/voice-notes/blob-url";

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

export function firstName(name: string | null | undefined): string {
  if (!name?.trim()) return "";
  return firstNameFromFull(name);
}

export type PublicVoiceNoteRecord = PublicVoiceNote & {
  share_token: string;
  sender_first_name: string;
  sender_id: string;
  listened_at: string | null;
  listen_count: number | null;
};

export async function fetchPublicVoiceNote(
  rawShareToken: string
): Promise<{ data: PublicVoiceNoteRecord | null; error: string | null }> {
  const shareToken = normalizeShareToken(rawShareToken);

  if (!shareToken || shareToken.length < 8) {
    return { data: null, error: "Not found" };
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
    return { data: null, error: error.message };
  }

  if (!voiceNote || voiceNote.audio_url === "pending") {
    return { data: null, error: "Not found" };
  }

  const senderId = voiceNote.sender_id ?? voiceNote.sender_user_id;
  const { data: sender } = await admin
    .from("users")
    .select("name, email")
    .eq("id", senderId)
    .maybeSingle();

  const senderName = sender?.name?.trim()
    ? formatPersonName(sender.name)
    : sender?.email?.split("@")[0] || "Someone";

  return {
    data: {
      share_token: shareToken,
      sender_name: senderName,
      sender_first_name: firstName(senderName),
      sender_id: senderId,
      sender_avatar_color: avatarColorFromUserId(senderId) as AvatarColor,
      audio_url: listenPageAudioUrl(shareToken, voiceNote.audio_url),
      duration_seconds: voiceNote.duration_seconds,
      peaks: normalizePeaks(voiceNote.waveform_peaks),
      transcript: voiceNote.transcript,
      sent_at: voiceNote.created_at,
      listened_at: voiceNote.listened_at,
      listen_count: voiceNote.listen_count,
    },
    error: null,
  };
}
