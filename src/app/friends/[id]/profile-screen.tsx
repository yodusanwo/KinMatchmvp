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
  SuggestedNextStepCard,
} from "@/components/profile";
import { VoiceNoteSentToast } from "@/components/profile/VoiceNoteSentToast";
import type { FriendProfile, MemoryNote } from "@/lib/api/types";
import { defaultSpotlightPrompt } from "@/lib/friends/utils";

type ProfileScreenProps = {
  friendId: string;
};

export function ProfileScreen({ friendId }: ProfileScreenProps) {
  const router = useRouter();
  const [friend, setFriend] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [highlightMemoryId, setHighlightMemoryId] = useState<string | null>(
    null
  );

  const loadProfile = useCallback(async () => {
    const res = await fetch(`/api/friends/${friendId}`);
    if (res.status === 401) {
      router.replace(`/signin?next=/friends/${friendId}`);
      return null;
    }
    if (!res.ok) {
      router.replace("/today");
      return null;
    }
    const data = (await res.json()) as FriendProfile;
    setFriend(data);
    setLoading(false);
    return data;
  }, [friendId, router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function handleMemorySaved(note: MemoryNote) {
    setFriend((current) => {
      if (!current) return current;
      return {
        ...current,
        memories: [note, ...current.memories],
      };
    });
    setHighlightMemoryId(note.id);
    window.setTimeout(() => setHighlightMemoryId(null), 2000);
  }

  if (loading || !friend) {
    return (
      <AppShell>
        <ProfileTopBar friendName="…" />
        <p className="px-5 py-10 font-inter text-sm italic text-ink-soft">
          Loading…
        </p>
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
            onAdd={() => setMemoryModalOpen(true)}
          />
          <InterestPills interests={friend.shared_interests} />
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
        onClose={() => setMemoryModalOpen(false)}
        onSaved={handleMemorySaved}
      />
    </AppShell>
  );
}
