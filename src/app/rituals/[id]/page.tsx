import { notFound } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth/require-user";
import { RitualDetailScreen } from "./ritual-detail-screen";

export default async function RitualDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireOnboardedUser(`/rituals/${id}`);

  const { data: ritual } = await supabase
    .from("rituals")
    .select(
      `
      id,
      name,
      description,
      frequency,
      recurrence_pattern,
      next_date,
      status,
      ritual_participants(friends(id, name)),
      ritual_occurrences(id, scheduled_date, status, completed_at, notes)
      `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (!ritual) notFound();

  return <RitualDetailScreen ritual={ritual} />;
}
