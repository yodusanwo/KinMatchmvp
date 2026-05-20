import type { PendingCapturePrompt } from "@/lib/api/types";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type PendingInteractionRow = {
  id: string;
  friend_id: string;
  mode: "voice_note" | null;
  type: string;
  occurred_at: string;
  friends: { id: string; name: string } | { id: string; name: string }[] | null;
};

export async function loadPendingCapturePrompts(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ prompts: PendingCapturePrompt[]; error?: string }> {
  const now = new Date();
  const earliest = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const latest = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("interactions")
    .select("id, friend_id, mode, type, occurred_at, friends(id, name)")
    .eq("user_id", userId)
    .eq("mode", "voice_note")
    .eq("type", "voice_note_sent")
    .gte("created_at", earliest)
    .lte("created_at", latest)
    .is("captured_at", null)
    .is("capture_prompt_dismissed_at", null);

  if (error) {
    return { prompts: [], error: error.message };
  }

  const rows = (data ?? []) as PendingInteractionRow[];
  const interactionIds = rows.map((item) => item.id);
  const { data: promptRows, error: promptError } =
    interactionIds.length > 0
      ? await supabase
          .from("discovery_prompts")
          .select("interaction_id")
          .in("interaction_id", interactionIds)
      : { data: [], error: null };

  if (promptError) {
    return { prompts: [], error: promptError.message };
  }

  const promptedInteractionIds = new Set(
    (promptRows ?? [])
      .map((row) => row.interaction_id as string | null)
      .filter((id): id is string => Boolean(id))
  );
  const pending = rows.filter((item) => !promptedInteractionIds.has(item.id));

  return {
    prompts: pending.flatMap((item) => {
      const friend = Array.isArray(item.friends)
        ? item.friends[0]
        : item.friends;
      if (!friend?.name) return [];
      return [
        {
          interaction_id: item.id,
          friend_id: item.friend_id,
          mode: "voice_note_sent" as const,
          occurred_at: item.occurred_at,
          friend_name: friend.name,
          prompt: `You sent ${friend.name} a voice note 2 days ago. Anything from their response to remember?`,
        },
      ];
    }),
  };
}
