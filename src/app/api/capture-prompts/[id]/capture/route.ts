import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("interactions")
    .update({ captured_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: interaction } = await supabase
    .from("interactions")
    .select("friend_id, discovery_prompts(prompt_cycle)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (interaction?.friend_id) {
    await supabase.from("interactions").insert({
      user_id: user.id,
      friend_id: interaction.friend_id,
      type: "voice_note_received",
      mode: "response_captured",
      direction: "inbound",
      occurred_at: new Date().toISOString(),
    });
  }

  const discoveryPrompt = Array.isArray(interaction?.discovery_prompts)
    ? interaction?.discovery_prompts[0]
    : interaction?.discovery_prompts;

  if (discoveryPrompt?.prompt_cycle === 5) {
    await supabase
      .from("users")
      .update({ discovery_completed_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  return NextResponse.json({ success: true });
}
