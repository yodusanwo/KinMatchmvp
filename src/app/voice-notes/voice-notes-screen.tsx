"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Search, X } from "lucide-react";
import { BrandBar, Eyebrow, Headline, Subhead, TextLink } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { formatDuration } from "@/components/voice-note/format-duration";
import { cn } from "@/lib/cn";
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

function StatusBadge({ note }: { note: VoiceNoteRow }) {
  // Listened — a calm, confirmed state: dark check on a light chip.
  if (note.listened_at) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-hairline bg-cream px-2 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.04em] text-ink">
        <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
        Listened
      </span>
    );
  }

  // Pending — a quiet neutral chip; burnt-orange text once it's been a while,
  // slate otherwise. Never loud orange-on-peach.
  const diffHours =
    (Date.now() - new Date(note.created_at).getTime()) / (1000 * 60 * 60);
  const waiting = diffHours > 24;
  const label = diffHours < 1 ? "Just sent" : waiting ? "Not yet listened" : "Sent";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm border border-hairline bg-cream-deep px-2 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.04em]",
        waiting ? "text-burnt-orange" : "text-slate"
      )}
    >
      {label}
    </span>
  );
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
      <div className="space-y-4 px-5 pb-28 pt-6">
        <Eyebrow>voice notes</Eyebrow>
        <Headline>What you&apos;ve sent.</Headline>
        <Subhead>Each voice note keeps the rhythm going.</Subhead>

        {notes.length === 0 ? (
          <div className="rounded-lg border border-hairline bg-cream-deep p-5">
            <p className="font-sans text-sm italic leading-relaxed text-slate">
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
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                aria-hidden
              />
              <input
                type="text"
                placeholder="Search by friend's name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-hairline-strong bg-cream-deep py-3 pl-10 pr-10 font-sans text-sm text-ink placeholder:text-slate/70 focus:border-carbon focus:outline-none focus:ring-1 focus:ring-carbon/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {filteredNotes.length === 0 ? (
              <div className="rounded-lg border border-hairline bg-cream-deep p-5">
                <p className="font-sans text-sm italic leading-relaxed text-slate">
                  No voice notes found for &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            ) : (
              <>
                {searchQuery && (
                  <p className="font-sans text-xs italic text-slate">
                    Showing {filteredNotes.length} of {notes.length}{" "}
                    {notes.length === 1 ? "note" : "notes"}
                  </p>
                )}
                <div className="space-y-2.5">
                  {filteredNotes.map((note) => {
                    const friendId = note.friend_id ?? note.recipient_friend_id;
                    const friend = friendId ? friendsById.get(friendId) : null;
                    const interaction = interactionByVoiceNoteId.get(note.id);

                    return (
                      <article
                        key={note.id}
                        className="rounded-lg border border-hairline bg-cream-deep p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            {friend && (
                              <span
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
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
                              <p className="truncate font-sans text-base font-semibold text-ink">
                                {friend?.name ?? "Voice note"}
                              </p>
                              <p className="font-sans text-[13px] italic text-slate">
                                {relativeDate(note.created_at)} ·{" "}
                                {formatDuration(note.duration_seconds)}
                              </p>
                            </div>
                          </div>
                          <StatusBadge note={note} />
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <Link
                            href={`/v/${note.share_token}`}
                            className="font-sans text-[13px] font-semibold text-burnt-orange underline decoration-burnt-orange/40 underline-offset-2"
                          >
                            open listen link
                          </Link>
                          {note.capture_pending &&
                            !note.captured_at &&
                            friendId &&
                            interaction && (
                              <Link
                                href={`/friends/${friendId}/details?capture=${interaction.id}`}
                                className="font-sans text-[13px] font-semibold text-burnt-orange underline decoration-burnt-orange/40 underline-offset-2"
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
