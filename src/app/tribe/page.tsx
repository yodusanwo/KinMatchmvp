import { requireOnboardedUser } from "@/lib/auth/require-user";
import { TribeScreen } from "./tribe-screen";

export default async function TribePage() {
  await requireOnboardedUser("/tribe");
  return <TribeScreen />;
}
