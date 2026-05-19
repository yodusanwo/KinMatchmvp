"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TextLink } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import {
  ActionRow,
  InterestPills,
  MemoryCaptureModal,
  MemorySection,
  ProfileHeader,
  ProfileTopBar,
  RecentInteractionsList,
  RitualList,
  SharedInterestModal,
  SuggestedNextStepCard,
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
import { defaultSpotlightPrompt } from "@/lib/friends/utils";

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
  const [sharedInterestModalOpen, setSharedInterestModalOpen] =
    useState(false);
  const [highlightMemoryId, setHighlightMemoryId] = useState<string | null>(
    null
  );

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
    setHighlightMemoryId(notes[0].id);
    window.setTimeout(() => setHighlightMemoryId(null), 2000);
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

  const prompt = defaultSpotlightPrompt(friend.name, friend.days_quiet);

  return (
    <AppShell>
      <ProfileTopBar friendName={friend.name} />

      <div className="px-5 pb-28 pt-6">
        <ProfileHeader friend={friend} />

        <SuggestedNextStepCard
          friendId={friend.id}
          prompt={prompt}
          className="mt-8"
        />

        <div className="mt-6">
          <ActionRow />
        </div>

        <div className="mt-8 space-y-8">
          <MemorySection
            friendName={friend.name}
            memories={friend.memories}
            highlightId={highlightMemoryId}
            onAddCategory={(category) => {
              setMemoryModalCategory(category);
              setMemoryModalOpen(true);
            }}
          />
          <InterestPills
            friendName={friend.name}
            interests={friend.shared_interests}
            onAdd={() => setSharedInterestModalOpen(true)}
          />
          <RitualList rituals={friend.rituals} />
          <RecentInteractionsList interactions={friend.interactions} />
        </div>

        <p className="mt-8 text-center">
          <TextLink href="/today">← Back to Today</TextLink>
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

      <SharedInterestModal
        open={sharedInterestModalOpen}
        friendId={friend.id}
        friendName={friend.name}
        avatarColor={friend.avatar_color}
        onClose={() => setSharedInterestModalOpen(false)}
        onSaved={handleSharedInterestSaved}
      />
    </AppShell>
  );
}
