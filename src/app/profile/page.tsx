import { requireUser } from "@/lib/auth/require-user";
import { ProfileScreen } from "./profile-screen";

export default async function ProfilePage() {
  const { supabase, user } = await requireUser("/profile");

  const { data: profile } = await supabase
    .from("users")
    .select(
      "name, email, avatar_url, onboarding_completed_at, daily_checkin_enabled, sunday_voice_drop_enabled, held_alerts_enabled"
    )
    .eq("id", user.id)
    .single();

  return (
    <ProfileScreen
      email={profile?.email ?? user.email ?? ""}
      name={profile?.name ?? null}
      avatarUrl={profile?.avatar_url ?? null}
      onboardingComplete={Boolean(profile?.onboarding_completed_at)}
      emailPreferences={{
        daily_checkin_enabled: profile?.daily_checkin_enabled ?? true,
        sunday_voice_drop_enabled: profile?.sunday_voice_drop_enabled ?? true,
        held_alerts_enabled: profile?.held_alerts_enabled ?? true,
      }}
    />
  );
}
