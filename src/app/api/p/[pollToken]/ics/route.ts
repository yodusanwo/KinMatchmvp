import { createAdminClient } from "@/lib/supabase/admin";
import { buildPlanIcs } from "@/lib/plans/ics";
import type { PublicPlanPoll } from "@/lib/plans/types";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ pollToken: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { pollToken } = await context.params;
  const admin = createAdminClient();

  const { data: poll, error } = await admin
    .from("plan_polls")
    .select(
      "poll_token, user_id, friend_id, message, option_1_datetime, option_2_datetime, option_3_datetime, selected_option"
    )
    .eq("poll_token", pollToken)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!poll || !poll.selected_option) {
    return NextResponse.json({ error: "No selected time yet" }, { status: 404 });
  }

  const [{ data: sender }, { data: friend }] = await Promise.all([
    admin.from("users").select("name, email").eq("id", poll.user_id).maybeSingle(),
    admin.from("friends").select("name").eq("id", poll.friend_id).maybeSingle(),
  ]);

  const publicPoll: PublicPlanPoll = {
    poll_token: poll.poll_token,
    sender_name:
      sender?.name?.trim() || sender?.email?.split("@")[0] || "Someone",
    friend_name: friend?.name ?? "there",
    message: poll.message,
    options: [
      { index: 1, datetime: poll.option_1_datetime },
      { index: 2, datetime: poll.option_2_datetime },
      { index: 3, datetime: poll.option_3_datetime },
    ],
    selected_option: poll.selected_option,
  };

  const ics = buildPlanIcs(publicPoll);
  if (!ics) {
    return NextResponse.json({ error: "Could not build calendar invite" }, { status: 500 });
  }

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="kinmatch-plan-${pollToken}.ics"`,
    },
  });
}
