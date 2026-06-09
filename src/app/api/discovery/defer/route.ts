import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { friend_id: friendId, day_number: dayNumber } = body;

  if (!friendId) {
    return NextResponse.json(
      { error: "friend_id required" },
      { status: 400 }
    );
  }

  // For discovery mode (has day_number), insert a skipped prompt record
  if (typeof dayNumber === "number") {
    const { error } = await supabase.from("discovery_prompts").insert({
      user_id: user.id,
      friend_id: friendId,
      prompt_day: dayNumber,
      question: null,
      category: "skipped",
      outreach_mode: null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // For algorithmic mode, update last_spotlight_at to mark as shown today
    const { error } = await supabase
      .from("friends")
      .update({ last_spotlight_at: new Date().toISOString() })
      .eq("id", friendId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
