import Link from "next/link";
import { BrandBar, Eyebrow, Headline, Subhead, TextLink } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import { formatDuration } from "@/components/voice-note/format-duration";
import { requireOnboardedUser } from "@/lib/auth/require-user";
import type { AvatarColor } from "@/lib/onboarding/types";

type VoiceNoteRow = {
  id: string;
  share_token: string;
  duration_seconds: number;
  created_at: string;
  listened_at: string | null;
  listen_count: number | null;
  capture_pending: boolean | null;
  captured_at: string | null;
  recipient_friend_id: string | null;
  friend_id: string | null;
};

type FriendRow = {
  id: string;
  name: string;
  avatar_color: AvatarColor;
};

type InteractionRow = {
  id: string;
  voice_note_id: string | null;
};

function relativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffHours < 1) return "just now";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
}

function statusLabel(note: VoiceNoteRow): {
  label: string;
  className: string;
} {
  const diffHours =
    (Date.now() - new Date(note.created_at).getTime()) / (1000 * 60 * 60);
  if (note.listened_at) {
    return {
      label: "Listened ✓",
      className: "bg-cream text-ink-soft",
    };
  }
  if (diffHours < 1) {
    return {
      label: "Just sent",
      className: "bg-terracotta/10 text-terracotta",
    };
  }
  if (diffHours > 24) {
    return {
      label: "Sent — not yet listened",
      className: "bg-terracotta/10 text-terracotta-deep",
    };
  }
  return {
    label: "Sent",
    className: "bg-cream text-ink-soft",
  };
}

export default async function VoiceNotesPage() {
  const { supabase, user } = await requireOnboardedUser("/voice-notes");

  const { data: voiceNotes } = await supabase
    .from("voice_notes")
    .select(
      "id, share_token, duration_seconds, created_at, listened_at, listen_count, capture_pending, captured_at, recipient_friend_id, friend_id"
    )
    .eq("sender_user_id", user.id)
    .neq("audio_url", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  const notes = (voiceNotes ?? []) as VoiceNoteRow[];
  const friendIds = Array.from(
    new Set(
      notes
        .map((note) => note.friend_id ?? note.recipient_friend_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  const voiceNoteIds = notes.map((note) => note.id);

  const [{ data: friends }, { data: interactions }] = await Promise.all([
    friendIds.length > 0
      ? supabase
          .from("friends")
          .select("id, name, avatar_color")
          .in("id", friendIds)
      : Promise.resolve({ data: [] }),
    voiceNoteIds.length > 0
      ? supabase
          .from("interactions")
          .select("id, voice_note_id")
          .in("voice_note_id", voiceNoteIds)
      : Promise.resolve({ data: [] }),
  ]);

  const friendsById = new Map(
    ((friends ?? []) as FriendRow[]).map((friend) => [friend.id, friend])
  );
  const interactionByVoiceNoteId = new Map(
    ((interactions ?? []) as InteractionRow[])
      .filter((interaction) => interaction.voice_note_id)
      .map((interaction) => [interaction.voice_note_id!, interaction])
  );

  return (
    <AppShell>
      <BrandBar />
      <div className="space-y-4 px-5 py-10 pb-28">
        <Eyebrow>voice notes</Eyebrow>
        <Headline>What you&apos;ve sent.</Headline>
        <Subhead>Each voice note keeps the rhythm going.</Subhead>

        {notes.length === 0 ? (
          <div className="rounded-2xl border border-ink/[0.12] bg-cream-deep/60 p-5">
            <p className="font-inter text-sm italic leading-relaxed text-ink-soft">
              You haven&apos;t sent a voice note yet. Today&apos;s a good day to
              start.
            </p>
            <p className="mt-4">
              <TextLink href="/today">← Back to Today</TextLink>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => {
              const friendId = note.friend_id ?? note.recipient_friend_id;
              const friend = friendId ? friendsById.get(friendId) : null;
              const status = statusLabel(note);
              const interaction = interactionByVoiceNoteId.get(note.id);

              return (
                <article
                  key={note.id}
                  className="rounded-2xl border border-ink/[0.12] bg-cream-deep/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {friend && (
                        <MiniAvatar
                          name={friend.name}
                          avatarColor={friend.avatar_color}
                          size="sm"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-sans text-sm font-medium text-ink">
                          {friend?.name ?? "Voice note"}
                        </p>
                        <p className="font-inter text-xs italic text-ink-soft">
                          {relativeDate(note.created_at)} ·{" "}
                          {formatDuration(note.duration_seconds)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 font-sans text-[10px] font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <Link
                      href={`/v/${note.share_token}`}
                      className="font-inter text-xs text-terracotta underline decoration-terracotta/60 underline-offset-2"
                    >
                      open listen link
                    </Link>
                    {note.capture_pending && !note.captured_at && friendId && interaction && (
                      <Link
                        href={`/friends/${friendId}/details?capture=${interaction.id}`}
                        className="font-inter text-xs text-terracotta underline decoration-terracotta/60 underline-offset-2"
                      >
                        + capture response →
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </AppShell>
  );
}
