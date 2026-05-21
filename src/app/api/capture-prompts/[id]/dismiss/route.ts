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

  const { data: capture } = await supabase
    .from("interactions")
    .select("capture_skip_count, voice_note_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const skipCount = (capture?.capture_skip_count ?? 0) + 1;
  const nextDueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("interactions")
    .update({
      capture_prompt_dismissed_at: new Date().toISOString(),
      capture_prompt_due_at: nextDueAt,
      capture_skip_count: skipCount,
      capture_archived_at:
        skipCount >= 7 ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (skipCount >= 7 && capture?.voice_note_id) {
    await supabase
      .from("voice_notes")
      .update({ capture_pending: false })
      .eq("id", capture.voice_note_id)
      .eq("sender_user_id", user.id);
  }

  return NextResponse.json({ success: true });
}
