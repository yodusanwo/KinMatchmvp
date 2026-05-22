import { ListenScreen } from "./listen-screen";
import { normalizeShareToken } from "@/lib/voice-notes/blob-url";

type PageProps = {
  params: Promise<{ shareToken: string }>;
};

/** Public voice note listening page — no auth required (Day 10). */
export default async function PublicVoiceNotePage({ params }: PageProps) {
  const { shareToken } = await params;
  return <ListenScreen shareToken={normalizeShareToken(shareToken)} />;
}
