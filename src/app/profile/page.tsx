import { requireUser } from "@/lib/auth/require-user";
import { ProfileScreen } from "./profile-screen";

export default async function ProfilePage() {
  const { supabase, user } = await requireUser("/profile");

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, email_preferences, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  return (
    <ProfileScreen
      email={profile?.email ?? user.email ?? ""}
      name={profile?.name ?? null}
      onboardingComplete={Boolean(profile?.onboarding_completed_at)}
      emailPreferences={
        profile?.email_preferences as
          | {
              daily_checkin?: boolean;
              sunday_voice_drop?: boolean;
              held_alerts?: boolean;
            }
          | null
      }
    />
  );
}
