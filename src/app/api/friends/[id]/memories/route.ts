import { createClient } from "@/lib/supabase/server";
import type { MemoryCategory, MemoryNote } from "@/lib/api/types";
import { mapMemoryNoteRow } from "@/lib/memories/map-note";
import { isMemoryCategory } from "@/lib/memories/types";
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

  let body: { text?: string; category?: string; event_date?: string };
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

  const category: MemoryCategory =
    body.category && isMemoryCategory(body.category)
      ? body.category
      : "current";

  let eventDate: string | null = null;
  if (category === "dates" && body.event_date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.event_date)) {
      return NextResponse.json(
        { error: "event_date must be YYYY-MM-DD" },
        { status: 400 }
      );
    }
    eventDate = body.event_date;
  }

  const { data, error } = await supabase
    .from("memory_notes")
    .insert({
      friend_id: friendId,
      text,
      tag: category,
      event_date: eventDate,
      source: "manual",
    })
    .select(
      "id, friend_id, text, tag, event_date, source, created_at, last_surfaced_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(mapMemoryNoteRow(data) as MemoryNote, {
    status: 201,
  });
}
