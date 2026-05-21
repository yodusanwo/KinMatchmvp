import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export function getActiveFriends(supabase: Supabase, userId: string) {
  return supabase
    .from("friends")
    .select("*")
    .eq("user_id", userId)
    .is("archived_at", null);
}
