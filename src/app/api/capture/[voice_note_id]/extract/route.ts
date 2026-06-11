import { createClient } from "@/lib/supabase/server";
import { extractMemoriesFromResponse } from "@/lib/ai/extract-memories";
import { mapCaptureVoiceNoteContext } from "@/lib/capture/context";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ voice_note_id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { voice_note_id: voiceNoteId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { user_recap?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userRecap = body.user_recap?.trim();
  if (!userRecap || userRecap.length < 2) {
    return NextResponse.json(
      { error: "Add a little of what they shared first." },
      { status: 400 }
    );
  }

  const { data: voiceNote } = await supabase
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
    .maybeSingle();

  if (!voiceNote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contextRow = mapCaptureVoiceNoteContext(voiceNote);
  if (!contextRow) {
    return NextResponse.json({ error: "Friend not found" }, { status: 404 });
  }

  const extracted = await extractMemoriesFromResponse({
    friend_name: contextRow.friend_name,
    original_question: contextRow.original_question,
    intended_category: contextRow.intended_category,
    user_recap: userRecap,
  });

  const { error } = await supabase.from("capture_drafts").upsert(
    {
      voice_note_id: voiceNoteId,
      user_id: user.id,
      raw_recap: userRecap,
      extracted_items: extracted,
    },
    { onConflict: "voice_note_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ extracted });
}
