"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandBar, Eyebrow, Headline, Subhead } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { TribeCircleGraphic } from "@/components/today/TribeCircleGraphic";
import { TodayPageSkeleton } from "@/components/ui/Skeleton";
import { fetchJson } from "@/lib/api/fetch-client";
import type { FriendSummary, TodayResponse } from "@/lib/api/types";

export function TribeScreen() {
  const router = useRouter();
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await fetchJson<TodayResponse>("/api/today");
      if (result.status === 401) {
        router.replace("/signin?next=/tribe");
        return;
      }
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setData(result.data);
      setLoading(false);
    }
    void load();
  }, [router]);

  const tribeCount = data?.tribe.length ?? 0;

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
        body: JSON.stringify({ name }),
      });
      const payload = (await response.json()) as {
        friend?: FriendSummary;
        error?: string;
      };

      if (!response.ok || !payload.friend) {
        throw new Error(payload.error ?? "Couldn't add them — try again");
      }

      setData((current) =>
        current
          ? { ...current, tribe: [...current.tribe, payload.friend!] }
          : current
      );
      setNewName("");
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
      <div className="flex h-[calc(100dvh-49px)] flex-col overflow-hidden px-5 pb-20 pt-4">
        <div className="space-y-1">
          <Eyebrow>Your tribe</Eyebrow>
          <Headline className="text-[28px] leading-tight">
            {tribeCount === 1 ? "1 person" : `${tribeCount} people`}
          </Headline>
          <Subhead className="text-sm leading-relaxed">
            Everyone you&apos;re tending this season.
          </Subhead>
        </div>

        {loading && <TodayPageSkeleton />}

        {error && (
          <p className="mt-8 font-inter text-sm italic text-terracotta-deep" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && data && (
          <div className="mt-6 flex flex-1 flex-col justify-center">
            <TribeCircleGraphic
              tribe={data.tribe}
              className="h-[300px] max-w-[340px]"
            />
            <p className="mt-4 text-center font-inter text-xs italic text-ink-soft">
              Tap a circle to open their profile.
            </p>
            <div className="mt-5">
              {addOpen ? (
                <form onSubmit={handleAddFriend} className="space-y-2">
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
                  {addError && (
                    <p className="font-inter text-xs italic text-terracotta-deep" role="alert">
                      {addError}
                    </p>
                  )}
                </form>
              ) : (
                <p className="text-center">
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="font-inter text-sm italic text-terracotta underline decoration-terracotta/60 underline-offset-2"
                  >
                    + add someone to your tribe
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </AppShell>
  );
}
