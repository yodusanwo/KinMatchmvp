import { ImageResponse } from "@vercel/og";
import {
  fetchPublicVoiceNote,
  firstName,
} from "@/lib/voice-notes/public-voice-note";
import { normalizeShareToken } from "@/lib/voice-notes/blob-url";

export const runtime = "edge";

type RouteContext = { params: Promise<{ shareToken: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { shareToken: rawShareToken } = await context.params;
  const shareToken = normalizeShareToken(rawShareToken);
  const { data: voiceNote } = await fetchPublicVoiceNote(shareToken);

  const senderName = firstName(voiceNote?.sender_name) || "a friend";
  const senderInitial = senderName[0]?.toUpperCase() ?? "K";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#F2EAD9",
          padding: "80px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontSize: "28px",
              fontWeight: 500,
              color: "#1F1A14",
            }}
          >
            Kin
            <span
              style={{
                fontStyle: "italic",
                color: "#B65232",
              }}
            >
              Match
            </span>
          </span>
          <div
            style={{
              width: "32px",
              height: "24px",
              display: "flex",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: "#B65232",
                position: "absolute",
                left: 0,
              }}
            />
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: "#2F4032",
                position: "absolute",
                left: "8px",
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            gap: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
            }}
          >
            <div
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                backgroundColor: "#2F4032",
                color: "#F2EAD9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "40px",
                fontWeight: 500,
              }}
            >
              {senderInitial}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "20px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "rgba(31, 26, 20, 0.55)",
                  fontWeight: 500,
                }}
              >
                a voice note from
              </span>
              <span
                style={{
                  fontSize: "80px",
                  fontWeight: 500,
                  color: "#1F1A14",
                  lineHeight: 1.1,
                  marginTop: "8px",
                }}
              >
                {senderName}
              </span>
            </div>
          </div>

          <span
            style={{
              fontSize: "32px",
              fontStyle: "italic",
              color: "rgba(31, 26, 20, 0.7)",
              marginTop: "24px",
            }}
          >
            Tap to listen — no app needed.
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
