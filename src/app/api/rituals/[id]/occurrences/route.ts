import { NextRequest, NextResponse } from "next/server";
import { isRitualFrequency, nextDateAfter } from "@/lib/rituals/types";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { status?: unknown; notes?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status === "missed" ? "missed" : "completed";

  const { data: ritual, error: ritualError } = await supabase
    .from("rituals")
    .select("id, frequency, next_date")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (ritualError) {
    return NextResponse.json({ error: ritualError.message }, { status: 500 });
  }

  if (!ritual || !isRitualFrequency(ritual.frequency)) {
    return NextResponse.json({ error: "Ritual not found" }, { status: 404 });
  }

  const scheduledDate = ritual.next_date ?? new Date().toISOString().slice(0, 10);
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;

  const occurrenceUpdate = {
    status,
    completed_at: status === "completed" ? new Date().toISOString() : null,
    notes,
  };

  const { data: updatedOccurrences, error: updateError } = await supabase
    .from("ritual_occurrences")
    .update(occurrenceUpdate)
    .eq("ritual_id", id)
    .eq("scheduled_date", scheduledDate)
    .eq("status", "upcoming")
    .select("id");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if ((updatedOccurrences ?? []).length === 0) {
    const { error } = await supabase.from("ritual_occurrences").insert({
      ritual_id: id,
      scheduled_date: scheduledDate,
      ...occurrenceUpdate,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const nextDate = nextDateAfter(scheduledDate, ritual.frequency);
  await supabase
    .from("rituals")
    .update(
      status === "completed"
        ? { next_date: nextDate, last_occurred_at: scheduledDate }
        : { next_date: nextDate, last_occurred_at: scheduledDate, streak_count: 0 }
    )
    .eq("id", id)
    .eq("user_id", user.id);

  if (nextDate) {
    await supabase.from("ritual_occurrences").insert({
      ritual_id: id,
      scheduled_date: nextDate,
      status: "upcoming",
    });
  }

  return NextResponse.json({ success: true, next_date: nextDate });
}
