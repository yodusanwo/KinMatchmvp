import { ImageResponse } from "@vercel/og";
import {
  fetchPublicVoiceNote,
} from "@/lib/voice-notes/public-voice-note";
import { formatDisplayName } from "@/lib/names/format";
import { normalizeShareToken } from "@/lib/voice-notes/blob-url";
import { getFriendshipTheme, type CardTheme } from "@/lib/voice-notes/card-themes";
import { generateNoteTitle } from "@/lib/voice-notes/note-titles";

export const runtime = "edge";

type RouteContext = { params: Promise<{ shareToken: string }> };

// Render themed icon based on theme's icon type
function renderThemedIcon(theme: CardTheme) {
  const size = 192;
  const colors = theme.colors;
  
  switch (theme.iconType) {
    case 'sunflower':
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", width: `${size}px`, height: `${size}px` }}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <div
                key={angle}
                style={{
                  position: "absolute",
                  width: `${size * 0.3125}px`,
                  height: `${size * 0.3125}px`,
                  backgroundColor: colors.accent,
                  borderRadius: "50% 50% 0 50%",
                  top: `${size * 0.34375}px`,
                  left: `${size * 0.34375}px`,
                  transform: `rotate(${angle}deg) translateY(-${size * 0.333}px)`,
                  transformOrigin: "center",
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                width: `${size * 0.4167}px`,
                height: `${size * 0.4167}px`,
                backgroundColor: colors.accentDark,
                borderRadius: "50%",
                top: `${size * 0.292}px`,
                left: `${size * 0.292}px`,
              }}
            />
          </div>
        </div>
      );
    
    case 'heart':
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: `${size}px`, height: `${size}px` }}>
          <div style={{ position: "relative", width: `${size * 0.667}px`, height: `${size * 0.667}px` }}>
            <div
              style={{
                position: "absolute",
                width: `${size * 0.333}px`,
                height: `${size * 0.5}px`,
                backgroundColor: colors.accent,
                borderRadius: `${size * 0.333}px ${size * 0.333}px 0 0`,
                left: "0",
                top: `${size * 0.0833}px`,
                transform: "rotate(-45deg)",
                transformOrigin: "100% 100%",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: `${size * 0.333}px`,
                height: `${size * 0.5}px`,
                backgroundColor: colors.accent,
                borderRadius: `${size * 0.333}px ${size * 0.333}px 0 0`,
                right: "0",
                top: `${size * 0.0833}px`,
                transform: "rotate(45deg)",
                transformOrigin: "0% 100%",
              }}
            />
          </div>
        </div>
      );
    
    case 'leaf':
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: `${size}px`, height: `${size}px` }}>
          <div
            style={{
              width: `${size * 0.625}px`,
              height: `${size * 0.833}px`,
              backgroundColor: colors.accent,
              borderRadius: "0 100% 100% 0",
              transform: "rotate(-30deg)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "4px",
                height: `${size * 0.729}px`,
                backgroundColor: colors.accentDark,
                left: "0",
                top: `${size * 0.052}px`,
              }}
            />
          </div>
        </div>
      );
    
    case 'wave':
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: `${size}px`, height: `${size}px`, backgroundColor: colors.backgroundSecondary, borderRadius: "50%", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: "0", left: "0", right: "0", height: `${size * 0.4167}px`, backgroundColor: colors.accent, borderRadius: "50% 50% 0 0" }} />
          <div style={{ position: "absolute", bottom: `${size * 0.125}px`, left: "0", right: "0", height: `${size * 0.3125}px`, backgroundColor: colors.accentDark, borderRadius: "50% 50% 0 0" }} />
        </div>
      );
    
    case 'star':
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: `${size}px`, height: `${size}px` }}>
          <div style={{ position: "relative", width: `${size * 0.833}px`, height: `${size * 0.833}px` }}>
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <div
                key={angle}
                style={{
                  position: "absolute",
                  width: `${size * 0.2083}px`,
                  height: `${size * 0.2083}px`,
                  backgroundColor: colors.accent,
                  borderRadius: "50%",
                  top: `${size * 0.3125}px`,
                  left: `${size * 0.3125}px`,
                  transform: `rotate(${angle}deg) translateY(-${size * 0.3125}px)`,
                }}
              />
            ))}
            <div style={{ position: "absolute", width: `${size * 0.3125}px`, height: `${size * 0.3125}px`, backgroundColor: colors.accentDark, borderRadius: "50%", top: `${size * 0.260}px`, left: `${size * 0.260}px` }} />
          </div>
        </div>
      );
    
    case 'sun':
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", width: `${size}px`, height: `${size}px` }}>
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
              <div
                key={angle}
                style={{
                  position: "absolute",
                  width: `${size * 0.15}px`,
                  height: `${size * 0.25}px`,
                  backgroundColor: colors.accent,
                  borderRadius: `${size * 0.075}px`,
                  top: `${size * 0.375}px`,
                  left: `${size * 0.425}px`,
                  transform: `rotate(${angle}deg) translateY(-${size * 0.35}px)`,
                  transformOrigin: "50% 100%",
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                width: `${size * 0.5}px`,
                height: `${size * 0.5}px`,
                backgroundColor: colors.accentDark,
                borderRadius: "50%",
                top: `${size * 0.25}px`,
                left: `${size * 0.25}px`,
              }}
            />
          </div>
        </div>
      );
    
    case 'moon':
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: `${size}px`, height: `${size}px` }}>
          <div style={{ position: "relative", width: `${size * 0.667}px`, height: `${size * 0.667}px` }}>
            <div style={{ width: "100%", height: "100%", backgroundColor: colors.accent, borderRadius: "50%" }} />
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backgroundColor: colors.background,
                borderRadius: "50%",
                top: `${size * 0.0833}px`,
                left: `${size * 0.0833}px`,
              }}
            />
          </div>
        </div>
      );
    
    case 'flower':
    default:
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", width: `${size}px`, height: `${size}px` }}>
            {[0, 72, 144, 216, 288].map((angle) => (
              <div
                key={angle}
                style={{
                  position: "absolute",
                  width: `${size * 0.375}px`,
                  height: `${size * 0.375}px`,
                  backgroundColor: colors.accent,
                  borderRadius: "50%",
                  top: `${size * 0.3125}px`,
                  left: `${size * 0.3125}px`,
                  transform: `rotate(${angle}deg) translateY(-${size * 0.28}px)`,
                  transformOrigin: "center",
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                width: `${size * 0.35}px`,
                height: `${size * 0.35}px`,
                backgroundColor: colors.accentDark,
                borderRadius: "50%",
                top: `${size * 0.325}px`,
                left: `${size * 0.325}px`,
              }}
            />
          </div>
        </div>
      );
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const { shareToken: rawShareToken } = await context.params;
  const shareToken = normalizeShareToken(rawShareToken);
  const { data: voiceNote } = await fetchPublicVoiceNote(shareToken);

  const senderName = formatDisplayName(voiceNote?.sender_name ?? "") || "a friend";
  
  // Generate theme based on friendship (using placeholder IDs for now)
  // In production, would use actual user_id and friend_id
  const theme = getFriendshipTheme(voiceNote?.sender_name ?? "default", "recipient");
  
  // Generate contextual note title
  const noteTitle = generateNoteTitle({
    timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening',
    daysSinceLastContact: 5, // Would come from database
    relationshipMomentum: 'stable',
  });

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: theme.colors.background,
          padding: "80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Subtle pattern overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.15,
            backgroundImage: `radial-gradient(circle at 20px 20px, ${theme.colors.accentDark} 2px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Header with KinMatch branding */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "12px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontSize: "24px",
              fontWeight: 500,
              color: theme.colors.textPrimary,
            }}
          >
            Kin
            <span
              style={{
                fontStyle: "italic",
                color: theme.colors.accent,
              }}
            >
              Match
            </span>
          </span>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            gap: "32px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Icon and Text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "32px",
              textAlign: "center",
            }}
          >
            {renderThemedIcon(theme)}
            
            {/* Note Title */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxWidth: "800px",
              }}
            >
              <span
                style={{
                  fontSize: "48px",
                  fontWeight: 600,
                  color: theme.colors.textPrimary,
                  lineHeight: 1.2,
                }}
              >
                {noteTitle}
              </span>
              
              <span
                style={{
                  fontSize: "28px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: theme.colors.textSecondary,
                  fontWeight: 400,
                }}
              >
                A voice note from
              </span>
              
              <span
                style={{
                  fontSize: "72px",
                  fontWeight: 500,
                  color: theme.colors.textPrimary,
                  lineHeight: 1.1,
                }}
              >
                {senderName}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontSize: "24px",
              fontStyle: "italic",
              color: theme.colors.textSecondary,
            }}
          >
            Tap to listen · No app needed
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
