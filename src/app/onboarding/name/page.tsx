import { NameScreen } from "./name-screen";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function metadataName(userMetadata: Record<string, unknown> | undefined) {
  const raw =
    userMetadata?.name ??
    userMetadata?.first_name ??
    userMetadata?.firstName ??
    userMetadata?.full_name;
  return typeof raw === "string" ? raw.trim() : "";
}

export default async function OnboardingNamePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin?next=/onboarding/name");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  const initialName = profile?.name?.trim() ?? "";
  const suggestedName = metadataName(user?.user_metadata);

  return (
    <NameScreen
      initialName={initialName}
      placeholderName={suggestedName || "Your first name"}
    />
  );
}
