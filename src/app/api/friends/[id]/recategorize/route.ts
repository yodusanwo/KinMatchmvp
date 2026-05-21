import { NextResponse } from "next/server";
import { isFriendCategory, CATEGORY_CADENCE_DAYS } from "@/lib/friends/categories";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

const DEFAULT_CADENCES = Object.values(CATEGORY_CADENCE_DAYS);

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { category?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isFriendCategory(body.category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const { data: current, error: currentError } = await supabase
    .from("friends")
    .select("id, category, cadence_days")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (currentError) {
    return NextResponse.json({ error: currentError.message }, { status: 500 });
  }

  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const update: {
    category: typeof body.category;
    cadence_days?: number;
  } = { category: body.category };

  if (DEFAULT_CADENCES.includes(current.cadence_days)) {
    update.cadence_days = CATEGORY_CADENCE_DAYS[body.category];
  }

  const { data, error } = await supabase
    .from("friends")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ friend: data });
}
