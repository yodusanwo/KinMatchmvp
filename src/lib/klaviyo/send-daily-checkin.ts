import { formatDailyCheckinSubject } from "@/lib/personalization";
import type { PersonalizableUser } from "@/lib/personalization";
import { getAppOrigin, hasKlaviyo } from "@/lib/env";

type SendDailyCheckinParams = {
  userEmail: string;
  user: PersonalizableUser;
  friendName: string;
  daysQuiet: number;
  memoryNote?: string | null;
  friendId: string;
};

/** Fires Klaviyo daily check-in with a barrier-personalized subject line. */
export async function sendDailyCheckinEmail(
  params: SendDailyCheckinParams
): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  if (!hasKlaviyo()) {
    return { sent: false, skipped: true };
  }

  const subject = formatDailyCheckinSubject(
    params.user,
    params.friendName,
    params.daysQuiet
  );
  const origin = getAppOrigin();
  const actionUrl = `${origin}/friends/${params.friendId}`;
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
              attributes: { name: "kinmatch_daily_checkin" },
            },
          },
          profile: {
            data: {
              type: "profile",
              attributes: { email: params.userEmail },
            },
          },
          properties: {
            friend_name: params.friendName,
            days_quiet: params.daysQuiet,
            memory_note: params.memoryNote ?? "",
            action_url: actionUrl,
            email_subject: subject,
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
