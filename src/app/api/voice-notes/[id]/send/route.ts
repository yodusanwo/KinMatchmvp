import { createClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/env";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
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
    .select(
      "id, share_token, duration_seconds, audio_url, recipient_friend_id, friend_id"
    )
    .eq("id", id)
    .eq("sender_user_id", user.id)
    .maybeSingle();

  if (!voiceNote) {
    return NextResponse.json({ error: "Voice note not found" }, { status: 404 });
  }

  if (voiceNote.audio_url === "pending") {
    return NextResponse.json(
      { error: "Upload the recording before sending" },
      { status: 400 }
    );
  }

  const listenUrl = `${getAppOrigin()}/v/${voiceNote.share_token}`;
  const friendId = voiceNote.friend_id ?? voiceNote.recipient_friend_id;

  if (friendId) {
    const { data: existingInteraction } = await supabase
      .from("interactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("voice_note_id", voiceNote.id)
      .eq("type", "voice_note_sent")
      .maybeSingle();

    if (!existingInteraction) {
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
        const { data: discoveryPrompt } = await supabase
          .from("discovery_prompts")
          .select("id")
          .eq("user_id", user.id)
          .eq("friend_id", friendId)
          .is("interaction_id", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

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
        .eq("user_id", user.id)
        .is("archived_at", null);
    }
  }

  return NextResponse.json({
    sent: true,
    skipped: false,
    listen_url: listenUrl,
  });
}
