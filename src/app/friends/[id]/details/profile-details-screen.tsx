"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import {
  MemoryCaptureModal,
  ProfileDetailsHub,
  ProfileTopBar,
  SharedInterestModal,
} from "@/components/profile";
import { VoiceNoteSentToast } from "@/components/profile/VoiceNoteSentToast";
import { ProfilePageSkeleton } from "@/components/ui/Skeleton";
import { fetchJson } from "@/lib/api/fetch-client";
import type {
  FriendProfile,
  MemoryCategory,
  MemoryNote,
  SharedInterest,
} from "@/lib/api/types";
import { trackEvent } from "@/lib/analytics/events";

type ProfileDetailsScreenProps = {
  friendId: string;
  captureInteractionId?: string | null;
};

export function ProfileDetailsScreen({
  friendId,
  captureInteractionId,
}: ProfileDetailsScreenProps) {
  const router = useRouter();
  const [friend, setFriend] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [memoryModalCategory, setMemoryModalCategory] = useState<
    MemoryCategory | undefined
  >(undefined);
  const [autoOpenedCaptureId, setAutoOpenedCaptureId] = useState<string | null>(
    null
  );
  const [sharedInterestModalOpen, setSharedInterestModalOpen] =
    useState(false);

  const loadProfile = useCallback(async () => {
    const result = await fetchJson<FriendProfile>(`/api/friends/${friendId}`);
    if (result.status === 401) {
      router.replace(`/signin?next=/friends/${friendId}/details`);
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

  useEffect(() => {
    if (!friend || !captureInteractionId || autoOpenedCaptureId === captureInteractionId) {
      return;
    }
    setMemoryModalCategory("current");
    setMemoryModalOpen(true);
    setAutoOpenedCaptureId(captureInteractionId);
  }, [autoOpenedCaptureId, captureInteractionId, friend]);

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
    if (captureInteractionId) {
      void fetch(`/api/capture-prompts/${captureInteractionId}/capture`, {
        method: "POST",
      });
      router.replace(`/friends/${friendId}/details`);
    }
  }

  function handleSharedInterestSaved(interest: SharedInterest) {
    setFriend((current) => {
      if (!current) return current;
      const exists = current.shared_interests.some(
        (existing) => existing.id === interest.id
      );
      if (exists) return current;
      return {
        ...current,
        shared_interests: [...current.shared_interests, interest].sort((a, b) =>
          a.label.localeCompare(b.label)
        ),
      };
    });
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

  return (
    <AppShell>
      <ProfileTopBar friendName={friend.name} />

      <div className="px-5 pb-24 pt-4">
        <div className="space-y-1">
          <p className="font-sans text-[15px] font-medium uppercase tracking-[0.12em] text-terracotta">
            Friend details
          </p>
          <h1 className="font-serif text-2xl leading-tight text-ink">
            Remembering {friend.name}
          </h1>
          <p className="font-inter text-xs italic leading-relaxed text-ink-soft">
            Choose what you want to add or review.
          </p>
        </div>

        <div className="mt-4">
          <ProfileDetailsHub
            friend={friend}
            onAddMemory={(category) => {
              setMemoryModalCategory(category);
              setMemoryModalOpen(true);
            }}
            onAddInterest={() => setSharedInterestModalOpen(true)}
          />
        </div>
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
        initialCategory={memoryModalCategory}
        onClose={() => {
          setMemoryModalOpen(false);
          setMemoryModalCategory(undefined);
        }}
        onSaved={handleMemoriesSaved}
      />

      <SharedInterestModal
        open={sharedInterestModalOpen}
        friendId={friend.id}
        friendName={friend.name}
        colorHex={friend.avatar_color_hex}
        onClose={() => setSharedInterestModalOpen(false)}
        onSaved={handleSharedInterestSaved}
      />
    </AppShell>
  );
}
