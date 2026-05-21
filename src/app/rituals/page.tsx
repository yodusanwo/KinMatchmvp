import { requireOnboardedUser } from "@/lib/auth/require-user";
import { RitualsScreen } from "./rituals-screen";

export default async function RitualsPage() {
  await requireOnboardedUser("/rituals");
  return <RitualsScreen />;
}
