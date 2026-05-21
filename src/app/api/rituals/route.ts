import { NextRequest, NextResponse } from "next/server";
import {
  frequencyLabel,
  isRitualFrequency,
  type RitualFrequency,
  type RitualSummary,
} from "@/lib/rituals/types";
import { createClient } from "@/lib/supabase/server";

type RitualRow = {
  id: string;
  name: string;
  description: string | null;
  frequency: RitualFrequency;
  recurrence_pattern: string | null;
  next_date: string | null;
  status: "active" | "paused" | "archived";
  ritual_participants?: {
    friends: { id: string; name: string } | { id: string; name: string }[] | null;
  }[];
  ritual_occurrences?: {
    id: string;
    scheduled_date: string;
    status: "upcoming" | "completed" | "missed";
    completed_at: string | null;
    notes: string | null;
  }[];
};

function mapRitual(row: RitualRow): RitualSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    frequency: row.frequency,
    recurrence_pattern: row.recurrence_pattern,
    next_date: row.next_date,
    status: row.status,
    participants: (row.ritual_participants ?? [])
      .flatMap((participant) => {
        if (!participant.friends) return [];
        return Array.isArray(participant.friends)
          ? participant.friends
          : [participant.friends];
      }),
    occurrences: row.ritual_occurrences ?? [],
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("rituals")
    .select(
      `
      id,
      name,
      description,
      frequency,
      recurrence_pattern,
      next_date,
      status,
      ritual_participants(friends(id, name)),
      ritual_occurrences(id, scheduled_date, status, completed_at, notes)
      `
    )
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("next_date", { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    rituals: ((data ?? []) as unknown as RitualRow[]).map(mapRitual),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: unknown;
    description?: unknown;
    frequency?: unknown;
    recurrence_pattern?: unknown;
    next_date?: unknown;
    friend_ids?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!isRitualFrequency(body.frequency)) {
    return NextResponse.json({ error: "Choose a frequency" }, { status: 400 });
  }

  const friendIds = Array.isArray(body.friend_ids)
    ? body.friend_ids.filter((id): id is string => typeof id === "string")
    : [];
  const nextDate =
    typeof body.next_date === "string" && body.next_date ? body.next_date : null;
  const recurrencePattern =
    typeof body.recurrence_pattern === "string" && body.recurrence_pattern.trim()
      ? body.recurrence_pattern.trim()
      : null;
  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;

  const { data: ritual, error } = await supabase
    .from("rituals")
    .insert({
      user_id: user.id,
      name,
      label: name,
      description,
      frequency: body.frequency,
      cadence: body.frequency,
      recurrence_pattern: recurrencePattern,
      next_date: nextDate,
      status: "active",
      friend_id: friendIds[0] ?? null,
    })
    .select("id")
    .single();

  if (error || !ritual) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create ritual" },
      { status: 500 }
    );
  }

  if (friendIds.length > 0) {
    const { error: participantError } = await supabase
      .from("ritual_participants")
      .insert(friendIds.map((friend_id) => ({ ritual_id: ritual.id, friend_id })));

    if (participantError) {
      return NextResponse.json({ error: participantError.message }, { status: 500 });
    }
  }

  if (nextDate) {
    await supabase.from("ritual_occurrences").insert({
      ritual_id: ritual.id,
      scheduled_date: nextDate,
      status: "upcoming",
    });
  }

  return NextResponse.json({ id: ritual.id }, { status: 201 });
}

export { frequencyLabel };
