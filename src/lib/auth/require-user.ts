import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireUser(nextPath?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/signin${next}`);
  }

  return { supabase, user };
}

export async function requireOnboardedUser(nextPath = "/today") {
  const { supabase, user } = await requireUser(nextPath);

  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_completed_at, timezone")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  return { supabase, user, profile };
}
