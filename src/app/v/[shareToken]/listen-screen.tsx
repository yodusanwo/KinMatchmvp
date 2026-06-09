"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandBar, Headline, PrimaryLink, Subhead } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import { ListenPageSkeleton } from "@/components/ui/Skeleton";
import { AudioPlayer } from "@/components/voice-note/AudioPlayer";
import { fetchJson } from "@/lib/api/fetch-client";
import type { PublicVoiceNote } from "@/lib/api/public-voice-note";

type ListenScreenProps = {
  shareToken: string;
};

function formatSentDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ListenScreen({ shareToken }: ListenScreenProps) {
  const [note, setNote] = useState<PublicVoiceNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const result = await fetchJson<PublicVoiceNote>(`/api/v/${shareToken}`);
      if (!result.ok) {
        setError(
          result.status === 404
            ? "This voice note is unavailable or has expired."
            : result.error
        );
        setLoading(false);
        return;
      }
      setNote(result.data);
      setLoading(false);
    }
    void load();
  }, [shareToken]);

  if (loading) {
    return (
      <AppShell>
        <BrandBar className="py-3" />
        <div className="px-5">
          <ListenPageSkeleton />
        </div>
      </AppShell>
    );
  }

  if (error || !note) {
    return (
      <AppShell>
        <BrandBar className="py-3" />
        <div className="px-5 py-16 text-center">
          <Headline>Voice note not found</Headline>
          <Subhead className="mt-3">{error}</Subhead>
          <p className="mt-8">
            <Link
              href="/"
              className="font-inter text-sm text-terracotta underline underline-offset-2"
            >
              Go to KinMatch
            </Link>
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <BrandBar className="py-3" />

      <div className="flex min-h-[calc(100vh-65px)] flex-col px-5 pb-10 pt-10">
        <div className="flex flex-col items-center text-center">
          <MiniAvatar
            name={note.sender_name}
            avatarColor={note.sender_avatar_color}
            size="md"
            className="h-20 w-20 text-base"
          />
          <Headline className="mt-5">{note.sender_name}</Headline>
          <p className="mt-2 font-inter text-sm italic text-ink-soft">
            sent a voice note · {formatSentDate(note.sent_at)}
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-ink/[0.12] bg-cream-deep/60 p-5">
          <AudioPlayer
            audioUrl={note.audio_url}
            peaks={note.peaks}
            durationSeconds={note.duration_seconds}
          />
        </div>

        {note.transcript && (
          <article className="mt-6 rounded-2xl border border-ink/[0.12] bg-cream-deep/40 p-5">
            <p className="font-sans text-[15px] font-medium uppercase tracking-[0.12em] text-ink-soft">
              Transcript
            </p>
            <p className="mt-3 font-inter text-sm leading-relaxed text-ink-soft">
              {note.transcript}
            </p>
          </article>
        )}

        <footer className="mt-auto pt-12 text-center">
          <p className="font-inter text-sm leading-relaxed text-ink-soft">
            This was sent through KinMatch.
            <br />
            Stay close to the people who matter most.
          </p>
          <PrimaryLink href="/" className="mt-6">
            Get KinMatch free →
          </PrimaryLink>
        </footer>
      </div>
    </AppShell>
  );
}
