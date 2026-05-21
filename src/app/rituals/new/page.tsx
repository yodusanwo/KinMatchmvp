import { requireOnboardedUser } from "@/lib/auth/require-user";
import { NewRitualScreen } from "./new-ritual-screen";

export default async function NewRitualPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  await requireOnboardedUser("/rituals/new");
  const params = await searchParams;
  return <NewRitualScreen template={params.template} />;
}
