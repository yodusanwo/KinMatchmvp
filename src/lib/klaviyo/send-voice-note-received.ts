import { getAppOrigin, hasKlaviyo } from "@/lib/env";

type SendVoiceNoteEmailParams = {
  recipientEmail: string;
  senderName: string;
  shareToken: string;
  durationSeconds: number;
};

export async function sendVoiceNoteReceivedEmail(
  params: SendVoiceNoteEmailParams
): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  if (!hasKlaviyo()) {
    return { sent: false, skipped: true };
  }

  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY!;
  const origin = getAppOrigin();
  const voiceNoteUrl = `${origin}/v/${params.shareToken}`;

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
              attributes: { name: "kinmatch_voice_note_received" },
            },
          },
          profile: {
            data: {
              type: "profile",
              attributes: { email: params.recipientEmail },
            },
          },
          properties: {
            voice_note_url: voiceNoteUrl,
            sender_name: params.senderName,
            duration: params.durationSeconds,
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
