import { createClient } from "@/lib/supabase/server";
import type { MemoryNote } from "@/lib/api/types";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id: friendId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: friend } = await supabase
    .from("friends")
    .select("id")
    .eq("id", friendId)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (!friend) {
    return NextResponse.json({ error: "Friend not found" }, { status: 404 });
  }

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text || text.length < 2) {
    return NextResponse.json(
      { error: "Please enter a note with at least 2 characters." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("memory_notes")
    .insert({
      friend_id: friendId,
      text,
      tag: "other",
      source: "manual",
    })
    .select("id, text, tag, event_date, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as MemoryNote, { status: 201 });
}
