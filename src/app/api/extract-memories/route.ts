import { createClient } from "@/lib/supabase/server";
import { extractMemoriesWithClaude } from "@/lib/memories/extract-with-claude";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Memory extraction is not configured yet." },
      { status: 503 }
    );
  }

  let body: { friend_id?: string; conversation_text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const friendId = body.friend_id;
  const conversationText = body.conversation_text?.trim();

  if (!friendId) {
    return NextResponse.json({ error: "friend_id is required" }, { status: 400 });
  }

  if (!conversationText || conversationText.length < 20) {
    return NextResponse.json(
      { error: "Paste a longer conversation to extract from (at least 20 characters)." },
      { status: 400 }
    );
  }

  const { data: friend } = await supabase
    .from("friends")
    .select("id, name")
    .eq("id", friendId)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (!friend) {
    return NextResponse.json({ error: "Friend not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("memory_notes")
    .select("text")
    .eq("friend_id", friendId)
    .order("created_at", { ascending: false })
    .limit(20);

  try {
    const candidates = await extractMemoriesWithClaude({
      friendName: friend.name,
      conversationText,
      existingMemories: (existing ?? []).map((row) => row.text),
    });

    return NextResponse.json({ candidates });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
