import type { AvatarColor } from "@/lib/onboarding/types";

export type PublicVoiceNote = {
  sender_name: string;
  sender_avatar_color: AvatarColor;
  audio_url: string;
  duration_seconds: number;
  peaks: number[];
  transcript: string | null;
  sent_at: string;
};
