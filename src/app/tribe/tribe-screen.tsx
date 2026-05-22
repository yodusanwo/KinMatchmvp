"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandBar, Eyebrow, Headline, Subhead } from "@/components/brand";
import { OptionalPhoneField } from "@/components/friends/OptionalPhoneField";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { TodayPageSkeleton } from "@/components/ui/Skeleton";
import { fetchJson } from "@/lib/api/fetch-client";
import type { FriendCategory, FriendSummary } from "@/lib/api/types";
import { firstName } from "@/lib/memories/categories";

type FriendsResponse = {
  friends: FriendSummary[];
};

const CATEGORY_COLORS: Record<FriendCategory, string[]> = {
  inner_circle: ["#B65232", "#2F4032"],
  village: ["#6B7A5C", "#C68F3E"],
  acquaintance: ["rgba(107,122,92,0.85)", "rgba(198,143,62,0.85)"],
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

function hashId(id: string) {
  return [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function categoryColor(friend: FriendSummary) {
  const palette = CATEGORY_COLORS[friend.category];
  return palette[hashId(friend.id) % palette.length];
}

function quietLabel(friend: FriendSummary) {
  if (!friend.last_touch_at) return null;
  if (friend.days_quiet === 0) return "today";
  return `${friend.days_quiet}d quiet`;
}

export function TribeScreen() {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCategory, setNewCategory] =
    useState<FriendCategory>("inner_circle");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [showAcquaintances, setShowAcquaintances] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await fetchJson<FriendsResponse>("/api/friends");
      if (result.status === 401) {
        router.replace("/signin?next=/tribe");
        return;
      }
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setFriends(result.data.friends);
      setLoading(false);
    }
    void load();
  }, [router]);

  const tribeCount = friends.length;
  const innerCircle = friends.filter((friend) => friend.category === "inner_circle");
  const village = friends.filter((friend) => friend.category === "village");
  const acquaintances = friends.filter(
    (friend) => friend.category === "acquaintance"
  );

  async function handleAddFriend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newName.trim();
    if (name.length < 3) {
      setAddError("Use at least 3 characters");
      return;
    }

    setAdding(true);
    setAddError(null);

    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category: newCategory,
          phone_number: newPhone.trim() || undefined,
        }),
      });
      const payload = (await response.json()) as {
        friend?: FriendSummary;
        error?: string;
      };

      if (!response.ok || !payload.friend) {
        throw new Error(payload.error ?? "Couldn't add them — try again");
      }

      setFriends((current) => [...current, payload.friend!]);
      setNewName("");
      setNewPhone("");
      setNewCategory("inner_circle");
      setAddOpen(false);
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Couldn't add them — try again"
      );
    } finally {
      setAdding(false);
    }
  }

  return (
    <AppShell>
      <BrandBar className="py-2" />
      <div className="min-h-[calc(100dvh-49px)] px-5 pb-24 pt-4">
        <div className="space-y-1">
          <Eyebrow>your tribe</Eyebrow>
          <Headline className="text-[28px] leading-tight">
            {tribeCount === 0
              ? "Build your tribe."
              : tribeCount === 1
                ? "1 person"
                : `${tribeCount} people`}
          </Headline>
          <Subhead className="text-sm leading-relaxed">
            {tribeCount === 0
              ? "Add the people you want KinMatch to help you stay close to."
              : "Everyone you're tending this season."}
          </Subhead>
        </div>

        {loading && <TodayPageSkeleton />}

        {error && (
          <p className="mt-8 font-inter text-sm italic text-terracotta-deep" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="mt-7 space-y-7">
            {tribeCount > 0 && (
              <>
                <CategorySection
                  title="inner circle"
                  friends={innerCircle}
                  avatarSize={42}
                  avatarTextSize={13}
                  emptyCopy="Pick people you'd consider closest. Add them anytime."
                />
                <CategorySection
                  title="village"
                  friends={village}
                  avatarSize={36}
                  avatarTextSize={11}
                  halo
                  emptyCopy="Friends you check in with regularly. Add them anytime."
                />
                <section>
                  <div className="flex items-center justify-between gap-3">
                    <Eyebrow>acquaintances · {acquaintances.length}</Eyebrow>
                    {acquaintances.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAcquaintances((value) => !value)}
                        className="font-inter text-[11px] text-terracotta underline decoration-terracotta/60 underline-offset-2"
                      >
                        {showAcquaintances ? "hide" : "show"}
                      </button>
                    )}
                  </div>
                  <p className="mt-1 font-inter text-[10px] italic text-[rgba(31,26,20,0.45)]">
                    {acquaintances.length === 0
                      ? "Promote anyone here as friendships deepen."
                      : "Lighter ties. Hidden by default."}
                  </p>
                  {showAcquaintances && acquaintances.length > 0 && (
                    <FriendGrid
                      friends={acquaintances}
                      avatarSize={32}
                      avatarTextSize={10}
                      className="mt-4"
                    />
                  )}
                </section>
              </>
            )}

            {tribeCount === 0 && !addOpen && (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="w-full rounded-full bg-terracotta px-6 py-3.5 font-sans text-sm font-semibold text-cream"
              >
                Add your first person →
              </button>
            )}

            {tribeCount > 0 && !addOpen && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="font-inter text-[11px] text-terracotta underline decoration-terracotta/60 underline-offset-2"
                >
                  + add someone to your tribe
                </button>
              </div>
            )}

            {addOpen && (
              <form onSubmit={handleAddFriend} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(event) => {
                      setNewName(event.target.value);
                      setAddError(null);
                    }}
                    placeholder="Add someone…"
                    className="min-w-0 flex-1 rounded-xl border border-ink/[0.25] bg-cream px-4 py-3 font-inter text-sm italic text-ink placeholder:text-ink-soft/70 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
                    aria-label="Add someone to your tribe"
                  />
                  <button
                    type="submit"
                    disabled={adding}
                    className="shrink-0 rounded-full bg-terracotta px-5 py-3 font-sans text-sm font-semibold text-cream transition-colors hover:bg-terracotta-deep disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {adding ? "Adding" : "Add"}
                  </button>
                </div>
                {newName.trim().length >= 2 && (
                  <OptionalPhoneField
                    friendName={newName}
                    value={newPhone}
                    onChange={setNewPhone}
                    id="tribe-add-phone"
                  />
                )}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["inner_circle", "Inner"] as const,
                    ["village", "Village"] as const,
                    ["acquaintance", "Acquaintance"] as const,
                  ].map(([category, label]) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setNewCategory(category)}
                      className={`rounded-full border px-3 py-2 font-sans text-[11px] font-semibold ${
                        newCategory === category
                          ? "border-terracotta bg-terracotta/10 text-ink"
                          : "border-ink/[0.16] text-ink-soft"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {addError && (
                  <p className="font-inter text-xs italic text-terracotta-deep" role="alert">
                    {addError}
                  </p>
                )}
              </form>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </AppShell>
  );
}

function CategorySection({
  title,
  friends,
  avatarSize,
  avatarTextSize,
  halo = false,
  emptyCopy,
}: {
  title: string;
  friends: FriendSummary[];
  avatarSize: number;
  avatarTextSize: number;
  halo?: boolean;
  emptyCopy: string;
}) {
  return (
    <section>
      <Eyebrow>{title} · {friends.length}</Eyebrow>
      {friends.length === 0 ? (
        <p className="mt-2 font-inter text-[10px] italic text-[rgba(31,26,20,0.45)]">
          {emptyCopy}
        </p>
      ) : (
        <FriendGrid
          friends={friends}
          avatarSize={avatarSize}
          avatarTextSize={avatarTextSize}
          halo={halo}
          className="mt-4"
        />
      )}
    </section>
  );
}

function FriendGrid({
  friends,
  avatarSize,
  avatarTextSize,
  halo = false,
  className,
}: {
  friends: FriendSummary[];
  avatarSize: number;
  avatarTextSize: number;
  halo?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap justify-center gap-x-[18px] gap-y-5 ${className ?? ""}`}>
      {friends.map((friend) => (
        <Link
          key={friend.id}
          href={`/friends/${friend.id}`}
          className="flex w-[58px] flex-col items-center text-center"
        >
          <span
            className="flex items-center justify-center rounded-full font-sans font-semibold text-cream"
            style={{
              width: avatarSize,
              height: avatarSize,
              backgroundColor: categoryColor(friend),
              fontSize: avatarTextSize,
              boxShadow: halo
                ? "0 0 0 1.5px #F2EAD9, 0 0 0 3px rgba(31,26,20,0.18)"
                : undefined,
            }}
          >
            {initials(friend.name)}
          </span>
          <span className="mt-2 truncate font-sans text-[10px] font-medium text-ink">
            {firstName(friend.name)}
          </span>
          {quietLabel(friend) && (
            <span className="mt-0.5 font-inter text-[9px] text-[rgba(31,26,20,0.5)]">
              {quietLabel(friend)}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
