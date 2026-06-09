import { getPersonalizedCopy } from "@/lib/personalization";
import type { PersonalizableUser } from "@/lib/personalization";

export type WelcomeEmailContent = {
  subject: string;
  previewText: string;
  /** Full body for in-app / debugging. */
  body: string;
  /** Personalized line only, maps to Klaviyo {{ event.welcome_body }}. */
  welcomeBody: string;
};

/** Static welcome email copy personalized by Q3 barriers (v1). */
export function buildWelcomeEmailContent(
  user: PersonalizableUser,
  firstName?: string | null
): WelcomeEmailContent {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi there,";
  const personalizedBody = getPersonalizedCopy(user, "welcomeBody");
  const welcomeBody = `${greeting} welcome to KinMatch.\n\n${personalizedBody}`;

  return {
    subject: "Your tribe is ready, KinMatch",
    previewText: welcomeBody.slice(0, 120),
    welcomeBody,
    body: `${welcomeBody}\n\nOpen Today when you're ready, we'll suggest one person to reach out to, not a whole inbox of guilt.\n\n- KinMatch`,
  };
}
