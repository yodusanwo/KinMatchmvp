import { redirect } from "next/navigation";
import { WelcomeContent } from "@/components/welcome/WelcomeContent";
import { getWelcomeAuthState } from "@/lib/auth/welcome-state";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const auth = await getWelcomeAuthState();

  if (auth.status === "complete") {
    redirect("/today");
  }

  return <WelcomeContent auth={auth} />;
}
