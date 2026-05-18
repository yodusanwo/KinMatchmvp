import { requireOnboardedUser } from "@/lib/auth/require-user";
import { HeldScreen } from "./held-screen";

export default async function HeldPage() {
  await requireOnboardedUser("/held");
  return <HeldScreen />;
}
