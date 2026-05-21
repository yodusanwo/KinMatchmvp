import { buildWelcomeEmailContent } from "@/lib/emails/welcome-email";
import { hasKlaviyo } from "@/lib/env";
import type { PersonalizableUser } from "@/lib/personalization";

type SendWelcomeEmailParams = {
  email: string;
  firstName?: string | null;
  user: PersonalizableUser;
};

/** Fires Klaviyo welcome event with personalized body for the flow template. */
export async function sendWelcomeEmail(
  params: SendWelcomeEmailParams
): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  if (!hasKlaviyo()) {
    return { sent: false, skipped: true };
  }

  const content = buildWelcomeEmailContent(params.user, params.firstName);
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY!;

  const response = await fetch("https://a.klaviyo.com/api/events/", {
    method: "POST",
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      "Content-Type": "application/json",
      revision: "2024-10-15",
    },
    body: JSON.stringify({
      data: {
        type: "event",
        attributes: {
          metric: {
            data: {
              type: "metric",
              attributes: { name: "kinmatch_welcome" },
            },
          },
          profile: {
            data: {
              type: "profile",
              attributes: {
                email: params.email,
                ...(params.firstName?.trim()
                  ? { first_name: params.firstName.trim() }
                  : {}),
              },
            },
          },
          properties: {
            subject: content.subject,
            preview_text: content.previewText,
            welcome_body: content.welcomeBody,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { sent: false, error: text || response.statusText };
  }

  return { sent: true };
}
