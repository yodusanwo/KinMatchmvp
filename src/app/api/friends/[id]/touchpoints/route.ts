import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const TOUCHPOINT_MODES = ["response_captured"] as const;
type TouchpointMode = (typeof TOUCHPOINT_MODES)[number];

function isTouchpointMode(value: unknown): value is TouchpointMode {
  return (
    typeof value === "string" &&
    TOUCHPOINT_MODES.includes(value as TouchpointMode)
  );
}

function interactionTypeForMode() {
  return "voice_note_received";
}

export async function POST(request: Request, context: RouteContext) {
  const { id: friendId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { mode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isTouchpointMode(body.mode)) {
    return NextResponse.json({ error: "Invalid touchpoint mode" }, { status: 400 });
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

  const now = new Date();
  const { data: interaction, error } = await supabase
    .from("interactions")
    .insert({
      user_id: user.id,
      friend_id: friendId,
      type: interactionTypeForMode(),
      mode: body.mode,
      direction: "outbound",
      occurred_at: now.toISOString(),
      capture_prompt_due_at: null,
    })
    .select("id, type, mode, occurred_at, capture_prompt_due_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ interaction }, { status: 201 });
}
