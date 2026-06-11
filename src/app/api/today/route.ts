import { createClient } from "@/lib/supabase/server";
import type { TodayResponse } from "@/lib/api/types";
import { buildTodayState } from "@/lib/today/get-daily-state";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, barriers, discovery_started_at, discovery_completed_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: profileError?.message ?? "Profile not found" },
      { status: 500 }
    );
  }

  const { dailyState, tribe, upNext } = await buildTodayState({
    supabase,
    user: {
      id: user.id,
      barriers: (profile.barriers ?? []) as string[],
      discovery_started_at: profile.discovery_started_at,
      discovery_completed_at: profile.discovery_completed_at,
    },
  });

  const spotlight =
    dailyState && dailyState.kind !== "capture"
      ? {
          friend_id: dailyState.friend.id,
          name: dailyState.friend.name,
          avatar_color: dailyState.friend.avatar_color,
          avatar_color_hex: dailyState.friend.avatar_color_hex ?? null,
          avatar_initials: dailyState.friend.avatar_initials ?? null,
          days_quiet: dailyState.friend.days_quiet,
          prompt_text:
            dailyState.kind === "send_discovery"
              ? dailyState.prompt.question
              : dailyState.personalized_prompt,
          suggested_action: "voice_note",
          primary_reason:
            dailyState.kind === "send_algorithmic"
              ? dailyState.primary_reason
              : undefined,
        }
      : null;

  return NextResponse.json({
    spotlight,
    upNext,
    dailyState,
    pendingCaptures: [],
    discoveryPrompt: null,
    tribe,
  } satisfies TodayResponse);
}
