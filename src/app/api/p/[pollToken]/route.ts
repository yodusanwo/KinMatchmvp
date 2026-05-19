import { createAdminClient } from "@/lib/supabase/admin";
import type { PublicPlanPoll } from "@/lib/plans/types";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ pollToken: string }> };

async function loadPublicPoll(pollToken: string): Promise<PublicPlanPoll | null> {
  const admin = createAdminClient();
  const { data: poll, error } = await admin
    .from("plan_polls")
    .select(
      "poll_token, user_id, friend_id, message, option_1_datetime, option_2_datetime, option_3_datetime, selected_option"
    )
    .eq("poll_token", pollToken)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!poll) return null;

  const [{ data: sender }, { data: friend }] = await Promise.all([
    admin.from("users").select("name, email").eq("id", poll.user_id).maybeSingle(),
    admin.from("friends").select("name").eq("id", poll.friend_id).maybeSingle(),
  ]);

  const senderName =
    sender?.name?.trim() || sender?.email?.split("@")[0] || "Someone";

  return {
    poll_token: poll.poll_token,
    sender_name: senderName,
    friend_name: friend?.name ?? "there",
    message: poll.message,
    options: [
      { index: 1, datetime: poll.option_1_datetime },
      { index: 2, datetime: poll.option_2_datetime },
      { index: 3, datetime: poll.option_3_datetime },
    ],
    selected_option: poll.selected_option,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { pollToken } = await context.params;
  if (!pollToken || pollToken.length < 8) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const poll = await loadPublicPoll(pollToken);
    if (!poll) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(poll);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load poll";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { pollToken } = await context.params;
  let body: { selected_option?: number; decline_reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const selectedOption = Number(body.selected_option);
  const declineReason = body.decline_reason?.trim() || null;

  if (![1, 2, 3].includes(selectedOption) && !declineReason) {
    return NextResponse.json(
      { error: "Pick a time or choose another-time option." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const updates =
    declineReason && ![1, 2, 3].includes(selectedOption)
      ? {
          selected_option: null,
          selected_at: new Date().toISOString(),
          decline_reason: declineReason,
        }
      : {
          selected_option: selectedOption,
          selected_at: new Date().toISOString(),
          decline_reason: null,
        };

  const { error } = await admin
    .from("plan_polls")
    .update(updates)
    .eq("poll_token", pollToken);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const poll = await loadPublicPoll(pollToken);
  if (!poll) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(poll);
}
