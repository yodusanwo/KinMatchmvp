import { requireOnboardedUser } from "@/lib/auth/require-user";
import { ProfileDetailsScreen } from "./profile-details-screen";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ capture?: string }>;
};

export default async function FriendDetailsPage({
  params,
  searchParams,
}: PageProps) {
  await requireOnboardedUser("/today");
  const { id } = await params;
  const { capture } = await searchParams;
  return <ProfileDetailsScreen friendId={id} captureInteractionId={capture ?? null} />;
}
