import { Suspense } from "react";
import { requireOnboardedUser } from "@/lib/auth/require-user";
import { VoiceNoteScreen } from "./voice-note-screen";

type PageProps = { params: Promise<{ id: string }> };

export default async function VoiceNotePage({ params }: PageProps) {
  await requireOnboardedUser("/today");
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <p className="px-5 py-10 font-inter text-sm italic text-ink-soft">
          Loading…
        </p>
      }
    >
      <VoiceNoteScreen friendId={id} />
    </Suspense>
  );
}
