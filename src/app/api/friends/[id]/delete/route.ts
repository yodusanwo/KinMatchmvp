import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
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
    .select("id, user_id")
    .eq("id", friendId)
    .single();

  if (fetchError || !friend) {
    return NextResponse.json({ error: "Friend not found" }, { status: 404 });
  }

  if (friend.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { error: deleteError } = await supabase
    .from("friends")
    .delete()
    .eq("id", friendId);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
