"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import type { HeldFriendEntry } from "@/lib/api/held";
import { heldQuietStatus } from "@/lib/held/status";

type HeldFriendRowProps = {
  entry: HeldFriendEntry;
};

export function HeldFriendRow({ entry }: HeldFriendRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState(entry.email ?? "");
  const [threshold, setThreshold] = useState(String(entry.threshold_days));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function saveSettings() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/held/${entry.relationship_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threshold_days: Number(threshold),
        partner_email: email.trim() || undefined,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setSaving(false);
    setMessage(res.ok ? "Saved" : (data.error ?? "Could not save"));
  }

  return (
    <li className="py-3.5">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/friends/${entry.friend_id}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg transition-colors hover:bg-cream-deep/60"
        >
          <MiniAvatar
            name={entry.name}
            avatarColor={entry.avatar_color}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate font-sans text-sm font-medium text-ink">
              {entry.name}
            </p>
            <p
              className={
                entry.at_threshold
                  ? "font-inter text-xs italic text-terracotta-deep"
                  : "font-inter text-xs italic text-ink-soft"
              }
            >
              {heldQuietStatus(
                entry.days_quiet,
                entry.threshold_days,
                entry.at_threshold
              )}
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="shrink-0 rounded-full border border-ink/[0.18] px-3 py-1.5 font-sans text-xs font-medium text-ink"
          aria-expanded={expanded}
        >
          {expanded ? "Done" : "Manage"}
        </button>
        <ChevronRight className="hidden h-4 w-4 shrink-0 text-ink-soft/50" aria-hidden />
      </div>
      {expanded && (
        <div className="mt-3 space-y-2 rounded-2xl border border-ink/[0.1] bg-cream-deep/35 p-3">
        <label className="block font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
          Quiet window
          <select
            value={threshold}
            onChange={(event) => setThreshold(event.target.value)}
            className="mt-1 w-full rounded-xl border border-ink/[0.2] bg-cream px-3 py-2 font-inter text-sm normal-case tracking-normal text-ink"
          >
            {[3, 5, 7, 10, 14, 21, 30].map((days) => (
              <option key={days} value={days}>
                Notify after {days} quiet days
              </option>
            ))}
          </select>
        </label>
        <label className="block font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
          Accountability partner email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={`${entry.name.toLowerCase()}@example.com`}
            className="mt-1 w-full rounded-xl border border-ink/[0.2] bg-cream px-3 py-2 font-inter text-sm normal-case tracking-normal text-ink placeholder:text-ink-soft/50"
          />
        </label>
        <div className="rounded-xl bg-cream/70 px-3 py-2">
          <p className="font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-ink-soft">
            What they&apos;ll receive
          </p>
          <p className="mt-1 font-inter text-xs italic leading-relaxed text-ink-soft">
            {`You've been chosen to hold someone in KinMatch. If they go quiet for ${threshold} days, we'll gently email you to check on them.`}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-inter text-xs italic text-ink-soft">
            {entry.setup_notified_at
              ? "Setup email sent"
              : "Save email to notify them."}
          </p>
          <button
            type="button"
            onClick={() => void saveSettings()}
            disabled={saving}
            className="rounded-full bg-terracotta px-4 py-2 font-sans text-xs font-medium text-cream disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        {message && (
          <p className="font-inter text-xs italic text-ink-soft">{message}</p>
        )}
        {entry.setup_notification_error && (
          <p className="font-inter text-xs italic text-terracotta-deep">
            Last email error: {entry.setup_notification_error}
          </p>
        )}
        </div>
      )}
    </li>
  );
}
