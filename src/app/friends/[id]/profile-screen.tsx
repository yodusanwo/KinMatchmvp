"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import {
  FriendManagementSheet,
  FriendPhoneSection,
  MemoryCaptureModal,
  MemorySection,
  ProfileHeader,
  ProfileTopBar,
  SuggestedNextStepCard,
} from "@/components/profile";
import { VoiceNoteSentToast } from "@/components/profile/VoiceNoteSentToast";
import { ProfilePageSkeleton } from "@/components/ui/Skeleton";
import { fetchJson } from "@/lib/api/fetch-client";
import type {
  FriendCategory,
  FriendProfile,
  MemoryCategory,
  MemoryNote,
} from "@/lib/api/types";
import { trackEvent } from "@/lib/analytics/events";
import { firstName } from "@/lib/memories/categories";
import {
  CATEGORY_CADENCE_DAYS,
  categoryRelationshipLabel,
  categoryToastLabel,
} from "@/lib/friends/categories";
import { cadenceLabel } from "@/lib/friends/utils";

type ProfileScreenProps = {
  friendId: string;
};

export function ProfileScreen({ friendId }: ProfileScreenProps) {
  const router = useRouter();
  const [friend, setFriend] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [memoryModalCategory, setMemoryModalCategory] = useState<
    MemoryCategory | undefined
  >(undefined);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"actions" | "confirm-remove">(
    "actions"
  );
  const [savingAction, setSavingAction] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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
        throw new Error(data.error ?? "Couldn't update — try again");
      }

      showToast(`${firstName(friend.name)} is now in ${categoryToastLabel(category)}.`);
    } catch (err) {
      setFriend(previous);
      showToast(err instanceof Error ? err.message : "Couldn't update — try again");
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
        throw new Error(data.error ?? "Couldn't remove — try again");
      }

      sessionStorage.setItem(
        "kinmatch-toast",
        `${firstName(friend.name)} removed from your tribe.`
      );
      router.replace("/today");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't remove — try again");
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

  const name = firstName(friend.name);
  const prompt = friend.profile_prompt;

  return (
    <AppShell>
      <ProfileTopBar
        friendName={name}
        onMore={() => {
          setSheetMode("actions");
          setSheetOpen(true);
        }}
      />

      <div className="px-5 pb-24 pt-4">
        <ProfileHeader friend={friend} />

        <SuggestedNextStepCard
          href={prompt.cta_href}
          quote={prompt.quote}
          whyThisWorks={prompt.kind === "send" ? prompt.why_this_works : null}
          capturePrompt={prompt.kind === "capture" ? prompt.prompt : undefined}
          ctaLabel={prompt.cta_label}
          sendMethodHint={
            prompt.kind === "send" ? (
              friend.phone_number ? (
                "→ Opens in Messages"
              ) : (
                <Link
                  href={`#friend-phone`}
                  className="text-terracotta underline decoration-terracotta/60 underline-offset-2"
                  onClick={(event) => {
                    event.preventDefault();
                    document
                      .getElementById("friend-phone")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Add {name}&apos;s number for one-tap sending →
                </Link>
              )
            ) : undefined
          }
          className="mt-4"
        />

        {prompt.kind === "send" && (
          <div id="friend-phone">
            <FriendPhoneSection
              friendId={friend.id}
              friendName={friend.name}
              phoneNumber={friend.phone_number}
              onSaved={(phoneNumber) =>
                setFriend((current) =>
                  current ? { ...current, phone_number: phoneNumber } : current
                )
              }
              onToast={showToast}
            />
          </div>
        )}

        {friend.memories.length > 0 && (
          <div className="mt-5">
            <MemorySection
              friendName={friend.name}
              memories={friend.memories}
              showAddControls={false}
              onAddCategory={(category) => {
                setMemoryModalCategory(category);
                setMemoryModalOpen(true);
              }}
            />
          </div>
        )}

        <p className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              setMemoryModalCategory("current");
              setMemoryModalOpen(true);
            }}
            className="font-inter text-sm text-terracotta underline decoration-terracotta/60 underline-offset-2"
          >
            + add a note about {name}
          </button>
        </p>
      </div>

      <BottomNav />

      <Suspense fallback={null}>
        <VoiceNoteSentToast friendName={friend.name} />
      </Suspense>

      <MemoryCaptureModal
        open={memoryModalOpen}
        friendId={friend.id}
        friendName={friend.name}
        avatarColor={friend.avatar_color}
        initialCategory={memoryModalCategory}
        onClose={() => {
          setMemoryModalOpen(false);
          setMemoryModalCategory(undefined);
        }}
        onSaved={handleMemoriesSaved}
      />

      {toast && (
        <p className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-40px)] max-w-[420px] -translate-x-1/2 rounded-full bg-ink px-4 py-3 text-center font-inter text-sm italic text-cream shadow-lg">
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
        onStartRemove={() => setSheetMode("confirm-remove")}
        onConfirmRemove={() => void handleArchive()}
      />
    </AppShell>
  );
}
