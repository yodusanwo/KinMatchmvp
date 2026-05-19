import { requireOnboardedUser } from "@/lib/auth/require-user";
import { PlanScreen } from "./plan-screen";

type PageProps = { params: Promise<{ id: string }> };

export default async function FriendPlanPage({ params }: PageProps) {
  await requireOnboardedUser("/today");
  const { id } = await params;
  return <PlanScreen friendId={id} />;
}
