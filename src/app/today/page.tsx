import { requireOnboardedUser } from "@/lib/auth/require-user";
import { TodayScreen } from "./today-screen";

export default async function TodayPage() {
  await requireOnboardedUser("/today");
  return <TodayScreen />;
}
