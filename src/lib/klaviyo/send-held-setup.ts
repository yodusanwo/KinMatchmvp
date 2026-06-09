import { getAppOrigin, hasKlaviyo } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

type SendHeldSetupEmailParams = {
  holderUserId: string;
  recipientEmail: string;
  holderName: string;
  userName: string;
  thresholdDays: number;
  setupMessage: string;
};

/** Notifies a friend that the user chose them as a Held accountability partner. */
export async function sendHeldSetupEmail(
  params: SendHeldSetupEmailParams
): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  if (!hasKlaviyo()) {
    return { sent: false, skipped: true };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("users")
    .select("held_alerts_enabled")
    .eq("id", params.holderUserId)
    .maybeSingle();

  if (profileError) {
    return { sent: false, error: profileError.message };
  }

  if (profile?.held_alerts_enabled === false) {
    console.log(`Skipping held alert for ${params.holderUserId}, disabled`);
    return { sent: false, skipped: true };
  }

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
              attributes: { name: "kinmatch_held_setup" },
            },
          },
          profile: {
            data: {
              type: "profile",
              attributes: { email: params.recipientEmail },
            },
          },
          properties: {
            holder_name: params.holderName,
            user_name: params.userName,
            quiet_window_days: params.thresholdDays,
            setup_message: params.setupMessage,
            app_url: getAppOrigin(),
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
