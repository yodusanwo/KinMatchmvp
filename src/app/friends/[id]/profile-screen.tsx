"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarHeart, Mic, Plus } from "lucide-react";
import { Eyebrow } from "@/components/brand";
import { primaryButtonClassName } from "@/components/brand/primary-button-styles";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import {
  AvatarColorPicker,
  FriendManagementSheet,
  MemoryCaptureModal,
  ProfileHeader,
  ProfileTopBar,
} from "@/components/profile";
import { VoiceNoteSentToast } from "@/components/profile/VoiceNoteSentToast";
import { ProfilePageSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { fetchJson } from "@/lib/api/fetch-client";
import type {
  FriendCategory,
  FriendProfile,
  Interaction,
  MemoryCategory,
  MemoryNote,
} from "@/lib/api/types";
import { trackEvent } from "@/lib/analytics/events";
import { formatDisplayName } from "@/lib/names/format";
import {
  CATEGORY_CADENCE_DAYS,
  categoryRelationshipLabel,
  categoryToastLabel,
} from "@/lib/friends/categories";
import { cadenceLabel } from "@/lib/friends/utils";

type ProfileScreenProps = {
  friendId: string;
};

function timeAgo(value: string | null) {
  if (!value) return "";
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return weeks < 5 ? `${weeks}w ago` : `${Math.floor(days / 30)}mo ago`;
}

function interactionLabel(interaction: Interaction) {
  if (interaction.type === "voice_note_sent") return "Voice note sent";
  return "Reached out";
}

function formatEventDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ProfileScreen({ friendId }: ProfileScreenProps) {
  const router = useRouter();
  const [friend, setFriend] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [memoryModalCategory, setMemoryModalCategory] = useState<
    MemoryCategory | undefined
  >(undefined);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<
    "actions" | "confirm-archive" | "confirm-delete"
  >("actions");
  const [savingAction, setSavingAction] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    const result = await fetchJson<FriendProfile>(`/api/friends/${friendId}`);
    if (result.status === 401) {
      router.replace(`/signin?next=/friends/${friendId}`);
      return null;
    }
    if (!result.ok) {
      router.replace("/today");
      return null;
    }
    setFriend(result.data);
    setLoading(false);
    return result.data;
  }, [friendId, router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function handleMemoriesSaved(notes: MemoryNote[]) {
    if (notes.length === 0) return;
    trackEvent("memory_added", { count: String(notes.length) });
    setFriend((current) => {
      if (!current) return current;
      return {
        ...current,
        memories: [...notes, ...current.memories],
      };
    });
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  }

  async function handleRecategorize(category: FriendCategory) {
    if (!friend || savingAction) return;
    const previous = friend;
    const nextCadence = CATEGORY_CADENCE_DAYS[category];

    setSavingAction(true);
    setFriend({
      ...friend,
      category,
      cadence_days: nextCadence,
      cadence_label: cadenceLabel(nextCadence),
      vibe_label: categoryRelationshipLabel(category),
      is_drifting: friend.days_quiet >= nextCadence,
    });
    setSheetOpen(false);

    try {
      const response = await fetch(`/api/friends/${friend.id}/recategorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Couldn't update, try again");
      }

      showToast(`${formatDisplayName(friend.name)} is now in ${categoryToastLabel(category)}.`);
    } catch (err) {
      setFriend(previous);
      showToast(err instanceof Error ? err.message : "Couldn't update, try again");
    } finally {
      setSavingAction(false);
      setSheetMode("actions");
    }
  }

  async function handleArchive() {
    if (!friend || savingAction) return;
    setSavingAction(true);

    try {
      const response = await fetch(`/api/friends/${friend.id}/archive`, {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Couldn't archive, try again");
      }

      sessionStorage.setItem(
        "kinmatch-toast",
        `${formatDisplayName(friend.name)} archived.`
      );
      router.replace("/today");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't archive, try again");
      setSavingAction(false);
    }
  }

  async function handleRestore() {
    if (!friend || savingAction) return;
    setSavingAction(true);
    setSheetOpen(false);

    try {
      const response = await fetch(`/api/friends/${friend.id}/restore`, {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        category?: FriendCategory;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Couldn't restore, try again");
      }

      const category = data.category ?? friend.category;
      sessionStorage.setItem(
        "kinmatch-toast",
        `${formatDisplayName(friend.name)} restored to ${categoryToastLabel(category)}. Tap to change.`
      );
      sessionStorage.setItem("kinmatch-toast-action", "change-category");
      sessionStorage.setItem("kinmatch-toast-friend-id", friend.id);
      router.replace("/tribe");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't restore, try again");
      setSavingAction(false);
    }
  }

  async function handleDelete() {
    if (!friend || savingAction) return;
    setSavingAction(true);

    try {
      const response = await fetch(`/api/friends/${friend.id}/delete`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Couldn't delete, try again");
      }

      sessionStorage.setItem(
        "kinmatch-toast",
        `${formatDisplayName(friend.name)} permanently deleted.`
      );
      router.replace("/tribe");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't delete, try again");
      setSavingAction(false);
    }
  }

  if (loading || !friend) {
    return (
      <AppShell>
        <ProfileTopBar friendName="…" />
        <div className="px-5">
          <ProfilePageSkeleton />
        </div>
      </AppShell>
    );
  }

  const name = formatDisplayName(friend.name);
  const prompt = friend.profile_prompt;

  function openAddNote() {
    setMemoryModalCategory("current");
    setMemoryModalOpen(true);
  }

  return (
    <AppShell>
      <ProfileTopBar
        friendName={name}
        onMore={() => {
          setSheetMode("actions");
          setSheetOpen(true);
        }}
      />

      <div className="space-y-8 px-5 pb-24 pt-5">
        {/* 1 — Profile header */}
        <section>
          <ProfileHeader
            friend={friend}
            onEditAvatar={() => setAvatarEditorOpen((open) => !open)}
          />
          <div className="flex justify-center">
            <AvatarColorPicker
              friendId={friend.id}
              friendName={friend.name}
              colorHex={friend.avatar_color_hex}
              initials={friend.avatar_initials}
              phoneNumber={friend.phone_number}
              open={avatarEditorOpen}
              onClose={() => setAvatarEditorOpen(false)}
              onSaved={(patch) =>
                setFriend((current) =>
                  current ? { ...current, ...patch } : current
                )
              }
            />
          </div>
        </section>

        {/* 2 — Hero: send a voice note */}
        <section>
          <article className="relative overflow-hidden rounded-xl rounded-tl-none bg-hero p-5">
            <span
              className="pointer-events-none absolute left-0 top-0 h-[11px] w-[11px] bg-terracotta"
              aria-hidden
            />
            {prompt.kind === "capture" ? (
              <>
                <p className="font-sans text-[15px] italic leading-relaxed text-hero-meta">
                  {prompt.quote}
                </p>
                <p className="mt-3 font-sans text-[15px] font-semibold leading-relaxed text-carbon">
                  {prompt.prompt}
                </p>
              </>
            ) : (
              <>
                <p className="font-sans text-[15px] font-semibold leading-relaxed text-carbon">
                  {prompt.quote}
                </p>
                {prompt.why_this_works && (
                  <p className="mt-2.5 font-sans text-xs italic leading-relaxed text-hero-meta">
                    {prompt.why_this_works}
                  </p>
                )}
              </>
            )}

            <Link
              href={prompt.cta_href}
              className={cn(primaryButtonClassName, "mt-4 gap-2")}
            >
              {prompt.kind !== "capture" && (
                <Mic className="h-4 w-4" strokeWidth={2} aria-hidden />
              )}
              {prompt.cta_label}
            </Link>

            <p className="mt-2.5 text-center font-sans text-xs italic text-hero-meta">
              {friend.phone_number ? (
                "Opens in Messages"
              ) : (
                <button
                  type="button"
                  onClick={() => setAvatarEditorOpen(true)}
                  className="font-semibold not-italic text-carbon underline decoration-carbon/40 underline-offset-2"
                >
                  Add a number for one-tap sending →
                </button>
              )}
            </p>
          </article>
        </section>

        {/* 3 — Notes */}
        <section className="space-y-2.5">
          <Eyebrow>notes</Eyebrow>
          {friend.memories.length > 0 ? (
            <>
              <ul className="space-y-2">
                {friend.memories.slice(0, 5).map((note) => (
                  <li
                    key={note.id}
                    className="rounded-lg border border-hairline bg-cream-deep px-4 py-3 font-sans text-sm leading-relaxed text-ink"
                  >
                    {note.text}
                    {note.event_date && note.category === "dates" && (
                      <span className="text-slate"> · {formatEventDate(note.event_date)}</span>
                    )}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={openAddNote}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-hairline-strong bg-cream-deep/40 px-4 py-3 font-sans text-sm font-semibold text-slate transition-colors hover:bg-cream-deep"
              >
                <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
                add a note about {name}
              </button>
            </>
          ) : (
            <div className="rounded-lg border border-hairline bg-cream-deep px-4 py-5 text-center">
              <p className="font-sans text-sm italic leading-relaxed text-slate">
                Nothing saved yet &mdash; jot down what matters about {name}.
              </p>
              <button
                type="button"
                onClick={openAddNote}
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-sm border-[1.5px] border-carbon px-4 py-2.5 font-sans text-[13px] font-bold uppercase tracking-[0.04em] text-carbon transition-colors hover:bg-carbon/[0.06]"
              >
                <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
                Add a note
              </button>
            </div>
          )}
        </section>

        {/* 4 — Recent history */}
        {(friend.interactions.length > 0 || friend.rituals.length > 0) && (
          <section className="space-y-2.5">
            <Eyebrow>recent</Eyebrow>
            <ul className="space-y-2">
              {friend.interactions.map((interaction) => (
                <li
                  key={interaction.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-cream-deep px-4 py-3"
                >
                  <span className="flex items-center gap-2.5 font-sans text-sm text-ink">
                    <Mic
                      className="h-4 w-4 shrink-0 text-slate"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    {interactionLabel(interaction)}
                  </span>
                  <span className="shrink-0 font-sans text-xs text-slate">
                    {timeAgo(interaction.occurred_at)}
                  </span>
                </li>
              ))}
              {friend.rituals.map((ritual) => (
                <li
                  key={ritual.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-cream-deep px-4 py-3"
                >
                  <span className="flex min-w-0 items-center gap-2.5 font-sans text-sm text-ink">
                    <CalendarHeart
                      className="h-4 w-4 shrink-0 text-slate"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="truncate">{ritual.label}</span>
                  </span>
                  <span className="shrink-0 font-sans text-xs text-slate">
                    {ritual.cadence}
                    {ritual.streak_count > 0 && ` · ${ritual.streak_count} in a row`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 5 — Their place in your tribe */}
        <section className="space-y-2.5">
          <Eyebrow>their place in your tribe</Eyebrow>
          <Link
            href="/today"
            className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-cream-deep px-4 py-3.5 transition-colors hover:bg-cream-deep/70"
          >
            <span className="min-w-0">
              <span className="block font-sans text-sm font-semibold text-ink">
                {name} is part of {categoryToastLabel(friend.category)}.
              </span>
              <span className="mt-0.5 block font-sans text-xs italic text-slate">
                See where {name} sits in your constellation.
              </span>
            </span>
            <span className="shrink-0 font-sans text-base text-burnt-orange" aria-hidden>
              →
            </span>
          </Link>
        </section>

        {/* Deep dive — the full record */}
        <Link
          href={`/friends/${friend.id}/details`}
          className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-cream-deep px-4 py-3.5 transition-colors hover:bg-cream-deep/70"
        >
          <span className="min-w-0">
            <span className="block font-sans text-sm font-semibold text-ink">
              See everything about {name}
            </span>
            <span className="mt-0.5 block font-sans text-xs italic text-slate">
              Notes, dates, shared interests &amp; more.
            </span>
          </span>
          <span className="shrink-0 font-sans text-base text-burnt-orange" aria-hidden>
            →
          </span>
        </Link>
      </div>

      <BottomNav />

      <Suspense fallback={null}>
        <VoiceNoteSentToast friendName={friend.name} />
      </Suspense>

      <MemoryCaptureModal
        open={memoryModalOpen}
        friendId={friend.id}
        friendName={friend.name}
        colorHex={friend.avatar_color_hex}
        initials={friend.avatar_initials}
        initialCategory={memoryModalCategory}
        onClose={() => {
          setMemoryModalOpen(false);
          setMemoryModalCategory(undefined);
        }}
        onSaved={handleMemoriesSaved}
      />

      {toast && (
        <p className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-40px)] max-w-[420px] -translate-x-1/2 rounded-sm bg-ink px-4 py-3 text-center font-inter text-sm text-white shadow-lg">
          {toast}
        </p>
      )}

      <FriendManagementSheet
        open={sheetOpen}
        mode={sheetMode}
        friend={friend}
        saving={savingAction}
        onClose={() => {
          setSheetOpen(false);
          setSheetMode("actions");
        }}
        onRecategorize={(category) => void handleRecategorize(category)}
        onStartArchive={() => setSheetMode("confirm-archive")}
        onConfirmArchive={() => void handleArchive()}
        onRestore={() => void handleRestore()}
        onStartDelete={() => setSheetMode("confirm-delete")}
        onConfirmDelete={() => void handleDelete()}
      />
    </AppShell>
  );
}
