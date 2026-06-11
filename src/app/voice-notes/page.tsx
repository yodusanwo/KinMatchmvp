import { requireOnboardedUser } from "@/lib/auth/require-user";
import { VoiceNotesScreen } from "./voice-notes-screen";
import type { FriendCategory } from "@/lib/api/types";

type VoiceNoteRow = {
  id: string;
  share_token: string;
  duration_seconds: number;
  created_at: string;
  listened_at: string | null;
  listen_count: number | null;
  capture_pending: boolean | null;
  captured_at: string | null;
  recipient_friend_id: string | null;
  friend_id: string | null;
};

type FriendRow = {
  id: string;
  name: string;
  category: FriendCategory | null;
  avatar_color_hex?: string | null;
};

type InteractionRow = {
  id: string;
  voice_note_id: string | null;
};

export default async function VoiceNotesPage() {
  const { supabase, user } = await requireOnboardedUser("/voice-notes");

  const { data: voiceNotes } = await supabase
    .from("voice_notes")
    .select(
      "id, share_token, duration_seconds, created_at, listened_at, listen_count, capture_pending, captured_at, recipient_friend_id, friend_id"
    )
    .eq("sender_user_id", user.id)
    .neq("audio_url", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  const notes = (voiceNotes ?? []) as VoiceNoteRow[];
  const friendIds = Array.from(
    new Set(
      notes
        .map((note) => note.friend_id ?? note.recipient_friend_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  const voiceNoteIds = notes.map((note) => note.id);

  const [{ data: friends }, { data: interactions }] = await Promise.all([
    friendIds.length > 0
      ? supabase
          .from("friends")
          .select("id, name, category, avatar_color_hex")
          .in("id", friendIds)
          .is("archived_at", null)
      : Promise.resolve({ data: [] }),
    voiceNoteIds.length > 0
      ? supabase
          .from("interactions")
          .select("id, voice_note_id")
          .in("voice_note_id", voiceNoteIds)
      : Promise.resolve({ data: [] }),
  ]);

  const friendsById = new Map(
    ((friends ?? []) as FriendRow[]).map((friend) => [friend.id, friend])
  );
  const interactionByVoiceNoteId = new Map(
    ((interactions ?? []) as InteractionRow[])
      .filter((interaction) => interaction.voice_note_id)
      .map((interaction) => [interaction.voice_note_id!, interaction])
  );

  return (
    <VoiceNotesScreen
      notes={notes}
      friendsById={friendsById}
      interactionByVoiceNoteId={interactionByVoiceNoteId}
    />
  );
}
