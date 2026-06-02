import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: friendId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: friend, error: fetchError } = await supabase
    .from("friends")
    .select("id, user_id, archived_at, category")
    .eq("id", friendId)
    .single();

  if (fetchError || !friend) {
    return NextResponse.json({ error: "Friend not found" }, { status: 404 });
  }

  if (friend.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!friend.archived_at) {
    return NextResponse.json(
      { error: "Friend is not archived" },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("friends")
    .update({ archived_at: null })
    .eq("id", friendId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    category: friend.category,
  });
}
