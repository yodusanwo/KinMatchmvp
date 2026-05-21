import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const archivedAt = new Date().toISOString();

  // v1.1: "Recently removed" surface in settings allows restoring archived friends within 30 days.
  const { error } = await supabase
    .from("friends")
    .update({ archived_at: archivedAt })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("held_relationships")
    .update({ archived_at: archivedAt })
    .eq("holder_user_id", user.id)
    .eq("held_friend_id", id);

  return NextResponse.json({ success: true });
}
