import type { AvatarColor } from "@/lib/onboarding/types";

export type CaptureVoiceNoteContext = {
  id: string;
  friend_id: string;
  friend_name: string;
  friend_avatar_color: AvatarColor;
  created_at: string;
  original_question: string | null;
  intended_category: string;
};

type VoiceNoteRow = {
  id: string;
  friend_id: string | null;
  recipient_friend_id: string | null;
  created_at: string;
  discovery_prompts:
    | {
        question: string | null;
        category: string | null;
      }
    | {
        question: string | null;
        category: string | null;
      }[]
    | null;
  friends:
    | {
        id: string;
        name: string;
        avatar_color: AvatarColor;
      }
    | {
        id: string;
        name: string;
        avatar_color: AvatarColor;
      }[]
    | null;
};

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function mapCaptureVoiceNoteContext(
  row: VoiceNoteRow
): CaptureVoiceNoteContext | null {
  const friend = firstOrNull(row.friends);
  if (!friend) return null;
  const prompt = firstOrNull(row.discovery_prompts);

  return {
    id: row.id,
    friend_id: row.friend_id ?? row.recipient_friend_id ?? friend.id,
    friend_name: friend.name,
    friend_avatar_color: friend.avatar_color,
    created_at: row.created_at,
    original_question: prompt?.question ?? null,
    intended_category: prompt?.category ?? "current",
  };
}
