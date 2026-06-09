import { ImageResponse } from "@vercel/og";
import {
  fetchPublicVoiceNote,
} from "@/lib/voice-notes/public-voice-note";
import { formatDisplayName } from "@/lib/names/format";
import { normalizeShareToken } from "@/lib/voice-notes/blob-url";

export const runtime = "edge";

type RouteContext = { params: Promise<{ shareToken: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { shareToken: rawShareToken } = await context.params;
  const shareToken = normalizeShareToken(rawShareToken);
  const { data: voiceNote } = await fetchPublicVoiceNote(shareToken);

  const senderName = formatDisplayName(voiceNote?.sender_name ?? "") || "a friend";
  const senderInitial = senderName[0]?.toUpperCase() ?? "K";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#2F4032",
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
              color: "#E8F0E8",
            }}
          >
            Kin
            <span
              style={{
                fontStyle: "italic",
                color: "#D4A356",
              }}
            >
              Match
            </span>
          </span>
          <div
            style={{
              width: "48px",
              height: "32px",
              display: "flex",
              position: "relative",
            }}
          >
            {/* Left silhouette (light sage) */}
            <div
              style={{
                position: "absolute",
                left: "0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  backgroundColor: "#B5C5B5",
                }}
              />
              <div
                style={{
                  width: "20px",
                  height: "14px",
                  backgroundColor: "#B5C5B5",
                  borderRadius: "0 0 10px 10px",
                  marginTop: "1px",
                }}
              />
            </div>
            {/* Right silhouette (terracotta) */}
            <div
              style={{
                position: "absolute",
                left: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  backgroundColor: "#D4A356",
                }}
              />
              <div
                style={{
                  width: "20px",
                  height: "14px",
                  backgroundColor: "#D4A356",
                  borderRadius: "0 0 10px 10px",
                  marginTop: "1px",
                }}
              />
            </div>
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
                backgroundColor: "#B5C5B5",
                color: "#2F4032",
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
                  color: "rgba(232, 240, 232, 0.7)",
                  fontWeight: 500,
                }}
              >
                a voice note from
              </span>
              <span
                style={{
                  fontSize: "80px",
                  fontWeight: 500,
                  color: "#E8F0E8",
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
              color: "rgba(232, 240, 232, 0.8)",
              marginTop: "24px",
            }}
          >
            Tap to listen, no app needed.
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
