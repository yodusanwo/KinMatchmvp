import { ImageResponse } from "@vercel/og";
import {
  fetchPublicVoiceNote,
} from "@/lib/voice-notes/public-voice-note";
import { formatDisplayName } from "@/lib/names/format";
import { normalizeShareToken } from "@/lib/voice-notes/blob-url";

export const runtime = "edge";

type RouteContext = { params: Promise<{ shareToken: string }> };

// Simple hash function to get consistent icon for each sender
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Icon components - each returns JSX for the icon
function getSenderIcon(senderName: string) {
  const icons = [
    // Sunflower
    () => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: "96px", height: "96px" }}>
          {/* Petals */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <div
              key={angle}
              style={{
                position: "absolute",
                width: "30px",
                height: "30px",
                backgroundColor: "#f5c56e",
                borderRadius: "50% 50% 0 50%",
                top: "33px",
                left: "33px",
                transform: `rotate(${angle}deg) translateY(-32px)`,
                transformOrigin: "center",
              }}
            />
          ))}
          {/* Center */}
          <div
            style={{
              position: "absolute",
              width: "40px",
              height: "40px",
              backgroundColor: "#8e3d22",
              borderRadius: "50%",
              top: "28px",
              left: "28px",
            }}
          />
        </div>
      </div>
    ),
    // Smiley Face
    () => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "96px", height: "96px", backgroundColor: "#f5c56e", borderRadius: "50%" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          {/* Eyes */}
          <div style={{ display: "flex", gap: "24px", marginTop: "20px" }}>
            <div style={{ width: "8px", height: "8px", backgroundColor: "#1f1a14", borderRadius: "50%" }} />
            <div style={{ width: "8px", height: "8px", backgroundColor: "#1f1a14", borderRadius: "50%" }} />
          </div>
          {/* Smile */}
          <div style={{ width: "32px", height: "16px", borderBottom: "4px solid #1f1a14", borderRadius: "0 0 100% 100%", marginTop: "4px" }} />
        </div>
      </div>
    ),
    // Leaf
    () => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "96px", height: "96px" }}>
        <div
          style={{
            width: "60px",
            height: "80px",
            backgroundColor: "#6b7a5c",
            borderRadius: "0 100% 100% 0",
            transform: "rotate(-30deg)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "2px",
              height: "70px",
              backgroundColor: "#463c2e",
              left: "0",
              top: "5px",
            }}
          />
        </div>
      </div>
    ),
    // Heart
    () => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "96px", height: "96px" }}>
        <div style={{ position: "relative", width: "64px", height: "64px" }}>
          <div
            style={{
              position: "absolute",
              width: "32px",
              height: "48px",
              backgroundColor: "#b65232",
              borderRadius: "32px 32px 0 0",
              left: "0",
              top: "8px",
              transform: "rotate(-45deg)",
              transformOrigin: "100% 100%",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "32px",
              height: "48px",
              backgroundColor: "#b65232",
              borderRadius: "32px 32px 0 0",
              right: "0",
              top: "8px",
              transform: "rotate(45deg)",
              transformOrigin: "0% 100%",
            }}
          />
        </div>
      </div>
    ),
    // Simple Circle with Wave pattern
    () => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "96px", height: "96px", backgroundColor: "#B5C5B5", borderRadius: "50%", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: "0", left: "0", right: "0", height: "40px", backgroundColor: "#6b7a5c", borderRadius: "50% 50% 0 0" }} />
        <div style={{ position: "absolute", bottom: "12px", left: "0", right: "0", height: "30px", backgroundColor: "#8e9b7d", borderRadius: "50% 50% 0 0" }} />
      </div>
    ),
    // Star-like shape
    () => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "96px", height: "96px" }}>
        <div style={{ position: "relative", width: "80px", height: "80px" }}>
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <div
              key={angle}
              style={{
                position: "absolute",
                width: "20px",
                height: "20px",
                backgroundColor: "#D4A356",
                borderRadius: "50%",
                top: "30px",
                left: "30px",
                transform: `rotate(${angle}deg) translateY(-30px)`,
              }}
            />
          ))}
          <div style={{ position: "absolute", width: "30px", height: "30px", backgroundColor: "#c68f3e", borderRadius: "50%", top: "25px", left: "25px" }} />
        </div>
      </div>
    ),
  ];

  const hash = hashString(senderName);
  const iconIndex = hash % icons.length;
  const IconComponent = icons[iconIndex];
  
  return <IconComponent />;
}

export async function GET(_request: Request, context: RouteContext) {
  const { shareToken: rawShareToken } = await context.params;
  const shareToken = normalizeShareToken(rawShareToken);
  const { data: voiceNote } = await fetchPublicVoiceNote(shareToken);

  const senderName = formatDisplayName(voiceNote?.sender_name ?? "") || "a friend";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#f2ead9",
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
              color: "#1f1a14",
            }}
          >
            Kin
            <span
              style={{
                fontStyle: "italic",
                color: "#b65232",
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
            {/* Left silhouette */}
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
                  backgroundColor: "#6b7a5c",
                }}
              />
              <div
                style={{
                  width: "20px",
                  height: "14px",
                  backgroundColor: "#6b7a5c",
                  borderRadius: "0 0 10px 10px",
                  marginTop: "1px",
                }}
              />
            </div>
            {/* Right silhouette */}
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
                  backgroundColor: "#b65232",
                }}
              />
              <div
                style={{
                  width: "20px",
                  height: "14px",
                  backgroundColor: "#b65232",
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
            {getSenderIcon(senderName)}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "20px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "rgba(31, 26, 20, 0.6)",
                  fontWeight: 500,
                }}
              >
                a voice note from
              </span>
              <span
                style={{
                  fontSize: "80px",
                  fontWeight: 500,
                  color: "#1f1a14",
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
