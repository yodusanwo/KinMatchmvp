import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ACTIONS = ["engaged", "skipped", "snoozed", "replaced"] as const;
type SpotlightAction = (typeof ACTIONS)[number];

function isSpotlightAction(value: unknown): value is SpotlightAction {
  return typeof value === "string" && ACTIONS.includes(value as SpotlightAction);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { friend_id?: string; action?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.friend_id) {
    return NextResponse.json({ error: "friend_id is required" }, { status: 400 });
  }

  if (!isSpotlightAction(body.action)) {
    return NextResponse.json({ error: "Invalid spotlight action" }, { status: 400 });
  }

  const { data: latest, error: lookupError } = await supabase
    .from("spotlight_feedback")
    .select("id")
    .eq("user_id", user.id)
    .eq("friend_id", body.friend_id)
    .order("spotlight_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!latest) {
    return NextResponse.json(
      { error: "No spotlight feedback row found" },
      { status: 404 }
    );
  }

  const { error: updateError } = await supabase
    .from("spotlight_feedback")
    .update({
      action: body.action,
      action_at: new Date().toISOString(),
    })
    .eq("id", latest.id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
