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
import { formatDisplayName } from "@/lib/names/format";
import { getFriendColor, getInitials } from "@/lib/friends/avatar-colors";

type FriendsResponse = {
  friends: FriendSummary[];
};

function initials(name: string) {
  return getInitials(name);
}

function categoryColor(friend: FriendSummary) {
  return getFriendColor(friend.id, friend.category);
}

function quietLabel(friend: FriendSummary) {
  if (!friend.last_touch_at) return null;
  if (friend.days_quiet === 0) return "today";
  return `${friend.days_quiet}d quiet`;
}

function archivedDaysAgo(archivedAt: string) {
  const archived = new Date(archivedAt);
  const now = new Date();
  const diffMs = now.getTime() - archived.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "archived today";
  if (days === 1) return "archived 1 day ago";
  return `archived ${days} days ago`;
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
  const [showArchived, setShowArchived] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastClickable, setToastClickable] = useState(false);
  const [toastFriendId, setToastFriendId] = useState<string | null>(null);

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

      // Check for restoration toast
      const toastMsg = sessionStorage.getItem("kinmatch-toast");
      const toastAction = sessionStorage.getItem("kinmatch-toast-action");
      const friendId = sessionStorage.getItem("kinmatch-toast-friend-id");
      if (toastMsg) {
        sessionStorage.removeItem("kinmatch-toast");
        sessionStorage.removeItem("kinmatch-toast-action");
        sessionStorage.removeItem("kinmatch-toast-friend-id");
        setToast(toastMsg);
        setToastClickable(toastAction === "change-category");
        setToastFriendId(friendId);
        setTimeout(() => {
          setToast(null);
          setToastClickable(false);
          setToastFriendId(null);
        }, 5000);
      }
    }
    void load();
  }, [router]);

  function handleToastClick() {
    if (toastClickable && toastFriendId) {
      router.push(`/friends/${toastFriendId}`);
    }
  }

  const activeFriends = friends.filter((friend) => !friend.archived_at);
  const archivedFriends = friends.filter((friend) => !!friend.archived_at);
  const tribeCount = activeFriends.length;
  const innerCircle = activeFriends.filter((friend) => friend.category === "inner_circle");
  const village = activeFriends.filter((friend) => friend.category === "village");
  const family = activeFriends.filter((friend) => friend.category === "family");
  const acquaintances = activeFriends.filter(
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
        throw new Error(payload.error ?? "Couldn't add them, try again");
      }

      setFriends((current) => [...current, payload.friend!]);
      setNewName("");
      setNewPhone("");
      setNewCategory("inner_circle");
      setAddOpen(false);
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Couldn't add them, try again"
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
                  title="family"
                  friends={family}
                  avatarSize={38}
                  avatarTextSize={12}
                  emptyCopy="Family members you want to stay connected with."
                />
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
                        className="font-inter text-[15px] text-terracotta underline decoration-terracotta/60 underline-offset-2"
                      >
                        {showAcquaintances ? "hide" : "show"}
                      </button>
                    )}
                  </div>
                  <p className="mt-1 font-inter text-[12px] italic text-ink-soft/70">
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

                {archivedFriends.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between gap-3">
                      <Eyebrow>archived · {archivedFriends.length}</Eyebrow>
                      <button
                        type="button"
                        onClick={() => setShowArchived((value) => !value)}
                        className="font-inter text-[15px] text-terracotta underline decoration-terracotta/60 underline-offset-2"
                      >
                        {showArchived ? "hide" : "show"}
                      </button>
                    </div>
                    <p className="mt-1 font-inter text-[12px] italic text-ink-soft/70">
                      Hidden from active tribe. Tap to restore.
                    </p>
                    {showArchived && (
                      <FriendGrid
                        friends={archivedFriends}
                        avatarSize={32}
                        avatarTextSize={10}
                        className="mt-4"
                        isArchived
                      />
                    )}
                  </section>
                )}
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
                  className="font-inter text-[15px] text-terracotta underline decoration-terracotta/60 underline-offset-2"
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
                    className="shrink-0 rounded-full bg-terracotta px-4 py-3 font-sans text-sm font-semibold text-cream transition-colors hover:bg-terracotta-deep disabled:cursor-not-allowed disabled:opacity-60"
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
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["inner_circle", "Inner"] as const,
                    ["village", "Village"] as const,
                    ["family", "Family"] as const,
                    ["acquaintance", "Acquaintance"] as const,
                  ].map(([category, label]) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setNewCategory(category)}
                      className={`rounded-full border px-3 py-2 font-sans text-[15px] font-semibold ${
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

        {toast && (
          <button
            type="button"
            onClick={handleToastClick}
            className={`fixed bottom-24 left-1/2 z-50 w-[calc(100%-40px)] max-w-[420px] -translate-x-1/2 rounded-full bg-ink px-4 py-3 text-center font-inter text-sm italic text-cream shadow-lg ${toastClickable ? "cursor-pointer hover:bg-ink/90" : "cursor-default"}`}
          >
            {toast}
          </button>
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
        <p className="mt-2 font-inter text-[12px] italic text-ink-soft/70">
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
  isArchived = false,
}: {
  friends: FriendSummary[];
  avatarSize: number;
  avatarTextSize: number;
  halo?: boolean;
  className?: string;
  isArchived?: boolean;
}) {
  return (
    <div className={`flex flex-wrap justify-center gap-x-[18px] gap-y-5 ${className ?? ""}`}>
      {friends.map((friend) => (
        <Link
          key={friend.id}
          href={`/friends/${friend.id}`}
          className={`flex w-[58px] flex-col items-center text-center ${isArchived ? "opacity-50" : ""}`}
        >
          <div className="relative">
            <span
              className="flex items-center justify-center rounded-full font-sans font-semibold text-cream"
              style={{
                width: avatarSize,
                height: avatarSize,
                backgroundColor: categoryColor(friend),
                fontSize: avatarTextSize,
                boxShadow: halo
                  ? "0 0 0 1.5px rgba(232,240,232,0.3), 0 0 0 3px rgba(181,197,181,0.2)"
                  : undefined,
              }}
            >
              {initials(friend.name)}
            </span>
            {isArchived && (
              <span className="absolute bottom-0 right-0 rounded-full bg-ink/80 px-1.5 py-0.5 font-sans text-[7px] font-semibold uppercase tracking-wider text-cream">
                archived
              </span>
            )}
          </div>
          <span className="mt-2 truncate font-sans text-[12px] font-medium text-ink">
            {formatDisplayName(friend.name)}
          </span>
          {isArchived && friend.archived_at ? (
            <span className="mt-0.5 font-inter text-[9px] text-ink-soft/70">
              {archivedDaysAgo(friend.archived_at)}
            </span>
          ) : (
            quietLabel(friend) && (
              <span className="mt-0.5 font-inter text-[9px] text-ink-soft/70">
                {quietLabel(friend)}
              </span>
            )
          )}
        </Link>
      ))}
    </div>
  );
}
