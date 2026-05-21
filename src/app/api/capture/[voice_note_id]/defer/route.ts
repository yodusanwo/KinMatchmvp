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

  const { data: note } = await supabase
    .from("voice_notes")
    .select("capture_defer_count")
    .eq("id", voiceNoteId)
    .eq("sender_id", user.id)
    .maybeSingle();

  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const deferCount = (note.capture_defer_count ?? 0) + 1;
  const deferredUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("voice_notes")
    .update({
      capture_defer_count: deferCount,
      capture_deferred_until: deferredUntil,
      capture_pending: deferCount < 7,
      capture_abandoned: deferCount >= 7,
    })
    .eq("id", voiceNoteId)
    .eq("sender_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
