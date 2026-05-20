"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import {
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
  FriendProfile,
  MemoryCategory,
  MemoryNote,
} from "@/lib/api/types";
import { trackEvent } from "@/lib/analytics/events";
import { firstName } from "@/lib/memories/categories";

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
      <ProfileTopBar friendName={friend.name} />

      <div className="px-5 pb-24 pt-4">
        <ProfileHeader friend={friend} />

        <SuggestedNextStepCard
          href={prompt.cta_href}
          quote={prompt.quote}
          whyThisWorks={prompt.kind === "send" ? prompt.why_this_works : null}
          capturePrompt={prompt.kind === "capture" ? prompt.prompt : undefined}
          ctaLabel={prompt.cta_label}
          className="mt-4"
        />

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

    </AppShell>
  );
}
