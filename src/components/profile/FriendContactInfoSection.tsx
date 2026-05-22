"use client";

import { useEffect, useState } from "react";
import { Eyebrow, Subhead } from "@/components/brand";
import { OptionalPhoneField } from "@/components/friends/OptionalPhoneField";
import { fetchJson } from "@/lib/api/fetch-client";
import type { FriendSummary } from "@/lib/api/types";
import { firstName } from "@/lib/memories/categories";

type FriendContactInfoSectionProps = {
  onToast: (message: string) => void;
};

export function FriendContactInfoSection({
  onToast,
}: FriendContactInfoSectionProps) {
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const result = await fetchJson<{ friends: FriendSummary[] }>("/api/friends");
      if (result.ok) {
        setFriends(result.data.friends);
        setDrafts(
          Object.fromEntries(
            result.data.friends.map((friend) => [
              friend.id,
              friend.phone_number ?? "",
            ])
          )
        );
      }
      setLoading(false);
    })();
  }, []);

  async function saveFriendPhone(friendId: string) {
    setSavingId(friendId);
    try {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: drafts[friendId] ?? "" }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        phone_number?: string | null;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Couldn't save — try again.");
      }
      setFriends((current) =>
        current.map((friend) =>
          friend.id === friendId
            ? { ...friend, phone_number: data.phone_number ?? null }
            : friend
        )
      );
      setDrafts((current) => ({
        ...current,
        [friendId]: data.phone_number ?? "",
      }));
      onToast("Saved.");
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Couldn't save — try again."
      );
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <section className="mt-10">
        <Eyebrow>friend contact info</Eyebrow>
        <Subhead className="mt-2">Loading…</Subhead>
      </section>
    );
  }

  if (friends.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 space-y-4">
      <div>
        <Eyebrow>friend contact info</Eyebrow>
        <Subhead className="mt-2">
          Numbers you save here only pre-fill your Messages app when you send a
          voice note. KinMatch never texts or calls them.
        </Subhead>
      </div>

      <ul className="space-y-5">
        {friends.map((friend) => (
          <li
            key={friend.id}
            className="rounded-2xl border border-ink/[0.12] bg-cream-deep/40 p-4"
          >
            <p className="font-sans text-sm font-semibold text-ink">
              {firstName(friend.name)}
            </p>
            <OptionalPhoneField
              friendName={friend.name}
              value={drafts[friend.id] ?? ""}
              onChange={(value) =>
                setDrafts((current) => ({ ...current, [friend.id]: value }))
              }
              id={`profile-friend-phone-${friend.id}`}
              className="mt-3"
            />
            <button
              type="button"
              disabled={savingId === friend.id}
              onClick={() => void saveFriendPhone(friend.id)}
              className="mt-3 font-sans text-sm font-semibold text-terracotta underline decoration-terracotta/60 underline-offset-2 disabled:opacity-60"
            >
              {savingId === friend.id ? "Saving…" : "Save"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
