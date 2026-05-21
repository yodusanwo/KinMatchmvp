import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ voice_note_id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { voice_note_id: voiceNoteId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("voice_notes")
    .update({
      capture_pending: false,
      captured_at: new Date().toISOString(),
    })
    .eq("id", voiceNoteId)
    .eq("sender_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("capture_drafts").delete().eq("voice_note_id", voiceNoteId).eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
