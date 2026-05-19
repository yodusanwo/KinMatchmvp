import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/env";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

function newPollToken(): string {
  return randomBytes(12).toString("base64url");
}

export async function POST(request: Request, context: RouteContext) {
  const { id: friendId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { message?: string; options?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const options = body.options ?? [];
  if (options.length !== 3) {
    return NextResponse.json(
      { error: "Choose exactly three time options." },
      { status: 400 }
    );
  }

  const parsedOptions = options.map((option) => new Date(option));
  if (parsedOptions.some((date) => Number.isNaN(date.getTime()))) {
    return NextResponse.json(
      { error: "Each time option must be a valid date and time." },
      { status: 400 }
    );
  }

  const { data: friend } = await supabase
    .from("friends")
    .select("id, name")
    .eq("id", friendId)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (!friend) {
    return NextResponse.json({ error: "Friend not found" }, { status: 404 });
  }

  const message = body.message?.trim() || null;
  const pollToken = newPollToken();

  const { data, error } = await supabase
    .from("plan_polls")
    .insert({
      poll_token: pollToken,
      user_id: user.id,
      friend_id: friendId,
      message,
      option_1_datetime: parsedOptions[0].toISOString(),
      option_2_datetime: parsedOptions[1].toISOString(),
      option_3_datetime: parsedOptions[2].toISOString(),
    })
    .select("id, poll_token")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pollUrl = `${getAppOrigin()}/p/${pollToken}`;
  return NextResponse.json(
    {
      id: data.id,
      poll_token: data.poll_token,
      poll_url: pollUrl,
      share_text: `Hey ${friend.name} — want to plan something? Pick a time → ${pollUrl}`,
    },
    { status: 201 }
  );
}
