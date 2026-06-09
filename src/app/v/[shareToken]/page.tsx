import type { Metadata } from "next";
import { ListenScreen } from "./listen-screen";
import { getAppOrigin } from "@/lib/env";
import {
  fetchPublicVoiceNote,
} from "@/lib/voice-notes/public-voice-note";
import { normalizeShareToken } from "@/lib/voice-notes/blob-url";
import { formatDisplayName } from "@/lib/names/format";

type PageProps = {
  params: Promise<{ shareToken: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { shareToken: rawShareToken } = await params;
  const shareToken = normalizeShareToken(rawShareToken);
  const { data: voiceNote } = await fetchPublicVoiceNote(shareToken);

  if (!voiceNote) {
    return {
      title: "Voice note not found",
    };
  }

  const origin = getAppOrigin("https://kin-matchmvp.vercel.app");
  const senderName = formatDisplayName(voiceNote.sender_name) || "a friend";
  const title = `Voice note from ${senderName}`;
  const description = "Tap to listen — no app needed.";
  const url = `${origin}/v/${shareToken}`;
  const imageUrl = `${origin}/api/og/voice-note/${shareToken}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "KinMatch",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

/** Public voice note listening page — no auth required (Day 10). */
export default async function PublicVoiceNotePage({ params }: PageProps) {
  const { shareToken } = await params;
  return <ListenScreen shareToken={normalizeShareToken(shareToken)} />;
}
