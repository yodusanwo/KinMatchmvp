import { createClient } from "@/lib/supabase/server";
import type { SharedInterest } from "@/lib/api/types";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id: friendId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  let body: { label?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const label = body.label?.trim().replace(/\s+/g, " ");
  if (!label || label.length < 2) {
    return NextResponse.json(
      { error: "Add an interest with at least 2 characters." },
      { status: 400 }
    );
  }

  if (label.length > 60) {
    return NextResponse.json(
      { error: "Keep shared interests under 60 characters." },
      { status: 400 }
    );
  }

  const { data: existing, error: existingError } = await supabase
    .from("shared_interests")
    .select("id, label")
    .eq("friend_id", friendId);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const duplicate = (existing ?? []).find(
    (interest) => interest.label.toLowerCase() === label.toLowerCase()
  );
  if (duplicate) {
    return NextResponse.json(duplicate as SharedInterest, { status: 200 });
  }

  const { data, error } = await supabase
    .from("shared_interests")
    .insert({ friend_id: friendId, label })
    .select("id, label")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as SharedInterest, { status: 201 });
}
