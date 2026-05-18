import { createClient } from "@/lib/supabase/server";

export type WelcomeAuthState =
  | { status: "guest" }
  | { status: "onboarding"; email: string | null }
  | { status: "complete" };

export async function getWelcomeAuthState(): Promise<WelcomeAuthState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "guest" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed_at) {
    return { status: "complete" };
  }

  return { status: "onboarding", email: user.email ?? null };
}
