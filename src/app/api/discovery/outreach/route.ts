import { createClient } from "@/lib/supabase/server";
import {
  getDiscoveryPromptForDay,
  renderDiscoveryQuestion,
} from "@/lib/discovery/prompt-library";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const friendId = searchParams.get("friend_id");
  const day = Number(searchParams.get("day") ?? "0");
  const prompt = getDiscoveryPromptForDay(day);

  if (!friendId || !prompt) {
    return NextResponse.redirect(`${origin}/today`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      `${origin}/signin?next=${encodeURIComponent(request.url.replace(origin, ""))}`
    );
  }

  const { data: friend } = await supabase
    .from("friends")
    .select("id, name, category")
    .eq("id", friendId)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (!friend) {
    return NextResponse.redirect(`${origin}/today`);
  }

  await supabase.from("discovery_prompts").insert({
    user_id: user.id,
    friend_id: friendId,
    prompt_day: day,
    prompt_cycle: prompt.cycle,
    question: renderDiscoveryQuestion(prompt, friend.name, friend.category),
    category: prompt.category,
    outreach_mode: "voice_note",
  });

  return NextResponse.redirect(`${origin}/friends/${friendId}/voice-note`);
}
