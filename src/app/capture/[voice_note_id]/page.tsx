import { notFound } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth/require-user";
import {
  mapCaptureVoiceNoteContext,
  type CaptureVoiceNoteContext,
} from "@/lib/capture/context";
import { CaptureInputScreen } from "./capture-input-screen";

type PageProps = {
  params: Promise<{ voice_note_id: string }>;
};

export default async function CaptureInputPage({ params }: PageProps) {
  const { voice_note_id: voiceNoteId } = await params;
  const { supabase, user } = await requireOnboardedUser(
    `/capture/${voiceNoteId}`
  );

  const [{ data: voiceNote }, { data: draft }] = await Promise.all([
    supabase
      .from("voice_notes")
      .select(
        `
        id,
        friend_id,
        recipient_friend_id,
        created_at,
        friends:friends!voice_notes_friend_id_fkey(id, name, avatar_color, avatar_color_hex),
        discovery_prompts(question, category)
        `
      )
      .eq("id", voiceNoteId)
      .eq("sender_id", user.id)
      .maybeSingle(),
    supabase
      .from("capture_drafts")
      .select("raw_recap")
      .eq("voice_note_id", voiceNoteId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!voiceNote) notFound();
  const context = mapCaptureVoiceNoteContext(
    voiceNote as unknown as Parameters<typeof mapCaptureVoiceNoteContext>[0]
  ) as CaptureVoiceNoteContext | null;
  if (!context) notFound();

  return (
    <CaptureInputScreen
      voiceNote={context}
      initialRecap={draft?.raw_recap ?? ""}
    />
  );
}
