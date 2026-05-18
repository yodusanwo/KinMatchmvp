import { requireOnboardedUser } from "@/lib/auth/require-user";
import { ProfileScreen } from "./profile-screen";

type PageProps = { params: Promise<{ id: string }> };

export default async function FriendProfilePage({ params }: PageProps) {
  await requireOnboardedUser("/today");
  const { id } = await params;
  return <ProfileScreen friendId={id} />;
}
