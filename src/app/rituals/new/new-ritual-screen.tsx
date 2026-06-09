"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandBar, Eyebrow, Headline, PrimaryButton, Subhead } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import { fetchJson } from "@/lib/api/fetch-client";
import type { FriendSummary } from "@/lib/api/types";
import type { RitualFrequency } from "@/lib/rituals/types";

type FriendsResponse = { friends: FriendSummary[] };

const FREQUENCIES: { value: RitualFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every other week" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Something else" },
];

const TEMPLATE_DEFAULTS: Record<string, Partial<FormState>> = {
  parent_call: { name: "Weekly call with a parent", frequency: "weekly" },
  coffee: { name: "Coffee every other Saturday", frequency: "biweekly", recurrence: "every other Saturday" },
  monthly_dinner: { name: "Monthly dinner with a group", frequency: "monthly" },
  birthday_call: { name: "Birthday call ritual", frequency: "yearly" },
  quarterly_trip: { name: "Quarterly trip with friends", frequency: "quarterly" },
  sunday_family: { name: "Sunday family time", frequency: "weekly" },
};

type FormState = {
  name: string;
  frequency: RitualFrequency;
  recurrence: string;
  nextDate: string;
};

export function NewRitualScreen({ template }: { template?: string }) {
  const router = useRouter();
  const defaults = TEMPLATE_DEFAULTS[template ?? ""] ?? {};
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [solo, setSolo] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: defaults.name ?? "",
    frequency: defaults.frequency ?? "weekly",
    recurrence: defaults.recurrence ?? "",
    nextDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const result = await fetchJson<FriendsResponse>("/api/friends");
      if (result.ok) setFriends(result.data.friends);
    }
    void load();
  }, []);

  const canSave = form.name.trim().length >= 2 && (solo || selectedIds.length > 0);
  const frequency = useMemo(
    () => FREQUENCIES.find((item) => item.value === form.frequency),
    [form.frequency]
  );

  function toggleFriend(id: string) {
    setSolo(false);
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((friendId) => friendId !== id)
        : [...current, id]
    );
  }

  async function submit() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);

    const response = await fetch("/api/rituals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        frequency: form.frequency,
        recurrence_pattern:
          form.frequency === "custom" ? form.recurrence : frequency?.label,
        next_date: form.nextDate || null,
        friend_ids: solo ? [] : selectedIds,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      id?: string;
      error?: string;
    };

    if (!response.ok || !data.id) {
      setError(data.error ?? "Could not create ritual.");
      setSaving(false);
      return;
    }

    router.replace("/rituals");
  }

  return (
    <AppShell>
      <BrandBar />
      <div className="px-5 pb-28 pt-6">
        <Link
          href="/rituals"
          className="font-inter text-sm text-terracotta underline underline-offset-2"
        >
          ← Rituals
        </Link>
        <div className="mt-6 space-y-2">
          <Eyebrow>new ritual</Eyebrow>
          <Headline>Create a rhythm.</Headline>
          <Subhead className="text-sm">
            Standing time with someone in your tribe.
          </Subhead>
        </div>

        <div className="mt-8 space-y-6">
          <label className="block space-y-2">
            <span className="font-sans text-[15px] font-medium uppercase tracking-[0.12em] text-ink-soft">
              Ritual name
            </span>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="e.g., Sunday dinner with mom"
              className="w-full rounded-xl border border-ink/[0.18] bg-cream px-4 py-3 font-inter text-sm text-ink"
            />
          </label>

          <section className="space-y-2">
            <Eyebrow>who&apos;s part of it</Eyebrow>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSolo(true);
                  setSelectedIds([]);
                }}
                className={`rounded-full border px-3 py-2 font-sans text-xs font-semibold ${
                  solo ? "border-terracotta bg-terracotta/10" : "border-ink/[0.16]"
                }`}
              >
                Just me
              </button>
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => toggleFriend(friend.id)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-2 font-sans text-xs font-semibold ${
                    selectedIds.includes(friend.id)
                      ? "border-terracotta bg-terracotta/10"
                      : "border-ink/[0.16]"
                  }`}
                >
                  <MiniAvatar name={friend.name} avatarColor={friend.avatar_color} size="sm" />
                  {friend.name.split(/\s+/)[0]}
                </button>
              ))}
            </div>
          </section>

          <label className="block space-y-2">
            <span className="font-sans text-[15px] font-medium uppercase tracking-[0.12em] text-ink-soft">
              How often
            </span>
            <select
              value={form.frequency}
              onChange={(event) =>
                setForm({ ...form, frequency: event.target.value as RitualFrequency })
              }
              className="w-full rounded-xl border border-ink/[0.18] bg-cream px-4 py-3 font-inter text-sm text-ink"
            >
              {FREQUENCIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          {form.frequency === "custom" && (
            <input
              value={form.recurrence}
              onChange={(event) =>
                setForm({ ...form, recurrence: event.target.value })
              }
              placeholder="e.g., 3rd Thursday of the month"
              className="w-full rounded-xl border border-ink/[0.18] bg-cream px-4 py-3 font-inter text-sm text-ink"
            />
          )}

          <label className="block space-y-2">
            <span className="font-sans text-[15px] font-medium uppercase tracking-[0.12em] text-ink-soft">
              When&apos;s the next one
            </span>
            <input
              type="date"
              value={form.nextDate}
              onChange={(event) =>
                setForm({ ...form, nextDate: event.target.value })
              }
              className="w-full rounded-xl border border-ink/[0.18] bg-cream px-4 py-3 font-inter text-sm text-ink"
            />
          </label>

          {error && (
            <p className="font-inter text-sm italic text-terracotta-deep" role="alert">
              {error}
            </p>
          )}
        </div>

        <PrimaryButton
          className="mt-8"
          disabled={!canSave || saving}
          onClick={() => void submit()}
        >
          {saving ? "Creating…" : "Create ritual →"}
        </PrimaryButton>
      </div>
      <BottomNav />
    </AppShell>
  );
}
