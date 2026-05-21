import { createClient } from "@/lib/supabase/server";
import { isMemoryCategory } from "@/lib/memories/types";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ voice_note_id: string }> };

type SaveItem = {
  text?: string;
  category?: string;
  event_date?: string | null;
};

export async function POST(request: Request, context: RouteContext) {
  const { voice_note_id: voiceNoteId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { items?: SaveItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];

  const { data: voiceNote } = await supabase
    .from("voice_notes")
    .select("id, friend_id, recipient_friend_id")
    .eq("id", voiceNoteId)
    .eq("sender_id", user.id)
    .maybeSingle();

  if (!voiceNote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const friendId = voiceNote.friend_id ?? voiceNote.recipient_friend_id;
  if (!friendId) {
    return NextResponse.json({ error: "Friend not found" }, { status: 404 });
  }

  const memoryRows = items.flatMap((item) => {
    const text = item.text?.trim();
    if (!text || text.length < 2) return [];
    return [
      {
        friend_id: friendId,
        text,
        tag: item.category && isMemoryCategory(item.category) ? item.category : "current",
        event_date: item.event_date || null,
        source: "voice_capture",
        voice_note_id: voiceNote.id,
      },
    ];
  });

  if (memoryRows.length > 0) {
    const { error: insertError } = await supabase
      .from("memory_notes")
      .insert(memoryRows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  await supabase
    .from("voice_notes")
    .update({
      capture_pending: false,
      captured_at: new Date().toISOString(),
    })
    .eq("id", voiceNoteId)
    .eq("sender_id", user.id);

  await supabase.from("interactions").insert({
    user_id: user.id,
    friend_id: friendId,
    type: "voice_note_received",
    mode: "response_captured",
    direction: "inbound",
    voice_note_id: voiceNote.id,
    occurred_at: new Date().toISOString(),
  });

  await supabase
    .from("capture_drafts")
    .delete()
    .eq("voice_note_id", voiceNoteId)
    .eq("user_id", user.id);

  return NextResponse.json({
    saved_count: memoryRows.length,
    friend_id: friendId,
  });
}
