"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { BrandBar, Eyebrow, Headline, Subhead, TextLink } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { formatDuration } from "@/components/voice-note/format-duration";
import {
  getAvatarTextColor,
  resolveFriendColor,
  resolveInitials,
} from "@/lib/friends/avatar-colors";
import type { FriendCategory } from "@/lib/api/types";

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
  category: FriendCategory | null;
  avatar_color_hex?: string | null;
  avatar_initials?: string | null;
};

type InteractionRow = {
  id: string;
  voice_note_id: string | null;
};

type VoiceNotesScreenProps = {
  notes: VoiceNoteRow[];
  friendsById: Map<string, FriendRow>;
  interactionByVoiceNoteId: Map<string, InteractionRow>;
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
      label: "Sent, not yet listened",
      className: "bg-terracotta/10 text-terracotta-deep",
    };
  }
  return {
    label: "Sent",
    className: "bg-cream text-ink-soft",
  };
}

export function VoiceNotesScreen({
  notes,
  friendsById,
  interactionByVoiceNoteId,
}: VoiceNotesScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter notes based on search query
  const filteredNotes = notes.filter((note) => {
    if (!searchQuery.trim()) return true;
    
    const friendId = note.friend_id ?? note.recipient_friend_id;
    const friend = friendId ? friendsById.get(friendId) : null;
    
    if (!friend) return false;
    
    return friend.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
          <>
            {/* Search Input */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
                aria-hidden
              />
              <input
                type="text"
                placeholder="Search by friend's name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-ink/[0.2] bg-cream-deep/40 py-3 pl-10 pr-10 font-inter text-sm text-ink placeholder:text-ink-soft/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {filteredNotes.length === 0 ? (
              <div className="rounded-2xl border border-ink/[0.12] bg-cream-deep/60 p-5">
                <p className="font-inter text-sm italic leading-relaxed text-ink-soft">
                  No voice notes found for &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            ) : (
              <>
                {searchQuery && (
                  <p className="font-inter text-xs italic text-ink-soft">
                    Showing {filteredNotes.length} of {notes.length}{" "}
                    {notes.length === 1 ? "note" : "notes"}
                  </p>
                )}
                <div className="space-y-3">
                  {filteredNotes.map((note) => {
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
                              <span
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-medium"
                                style={{
                                  backgroundColor: resolveFriendColor(
                                    friend.name,
                                    friend.avatar_color_hex
                                  ),
                                  color: getAvatarTextColor(
                                    resolveFriendColor(
                                      friend.name,
                                      friend.avatar_color_hex
                                    )
                                  ),
                                }}
                              >
                                {resolveInitials(friend.name, friend.avatar_initials)}
                              </span>
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
                            className={`shrink-0 rounded-full px-2.5 py-1 font-sans text-[12px] font-medium ${status.className}`}
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
                          {note.capture_pending &&
                            !note.captured_at &&
                            friendId &&
                            interaction && (
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
              </>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </AppShell>
  );
}
