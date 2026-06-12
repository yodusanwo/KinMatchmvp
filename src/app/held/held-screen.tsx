"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, MoreHorizontal, Plus, Trash2, UserCircle } from "lucide-react";
import { BrandBar, Eyebrow, Headline, Subhead } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import { HeldPageSkeleton } from "@/components/ui/Skeleton";
import { fetchJson } from "@/lib/api/fetch-client";
import type { HeldFriendEntry, HeldResponse } from "@/lib/api/held";
import type { AvatarColor } from "@/lib/onboarding/types";

type SheetMode = "none" | "actions" | "remove" | "add" | "threshold";

function formatDisplayName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

function timeAgo(value: string | null) {
  if (!value) return "never";
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${Math.max(1, hours)}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusLine(entry: HeldFriendEntry) {
  const invited = `invited ${timeAgo(entry.invited_at)}`;
  if (entry.last_notified_at) return `${invited} · notified ${timeAgo(entry.last_notified_at)}`;
  return `${invited} · ${entry.status}`;
}

function defaultInvitationMessage(name: string, thresholdDays: string) {
  return `Hi ${name}, I chose you as one of my holders in KinMatch. KinMatch helps me notice when I’ve gone quiet with people I care about. If I’m quiet for ${thresholdDays} days, KinMatch will send you a gentle heads-up so you can nudge me to reconnect. You don’t need to do anything right now, this is just me inviting you into that little accountability loop.`;
}

export function HeldScreen() {
  const router = useRouter();
  const [data, setData] = useState<HeldResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>("none");
  const [selected, setSelected] = useState<HeldFriendEntry | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [threshold, setThreshold] = useState("14");
  const [setupMessage, setSetupMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    const result = await fetchJson<HeldResponse>("/api/held");
      if (result.status === 401) {
        router.replace("/signin?next=/held");
        return;
      }
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setData(result.data);
      setThreshold(String(result.data.quiet_threshold_days));
      setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  }

  async function archiveSelected() {
    if (!selected) return;
    setSaving(true);
    const response = await fetch(`/api/held/${selected.relationship_id}/archive`, {
      method: "POST",
    });
    setSaving(false);
    if (!response.ok) {
      showToast("Couldn't remove, try again");
      return;
    }
    setSheetMode("none");
    showToast(`${formatDisplayName(selected.name)} removed from your circle`);
    await load();
  }

  async function resendSelected() {
    if (!selected) return;
    setSaving(true);
    const response = await fetch(`/api/held/${selected.relationship_id}/resend`, {
      method: "POST",
    });
    setSaving(false);
    if (!response.ok) {
      showToast("Couldn't resend, try again");
      return;
    }
    setSheetMode("none");
    showToast(`Invitation resent to ${formatDisplayName(selected.name)}`);
    await load();
  }

  async function inviteFriend() {
    if (!selectedFriendId) return;
    setSaving(true);
    const response = await fetch("/api/held/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        friend_id: selectedFriendId,
        setup_message: setupMessage,
      }),
    });
    setSaving(false);
    if (!response.ok) {
      showToast("Couldn't add them, try again");
      return;
    }
    setSelectedFriendId(null);
    setSetupMessage("");
    setSheetMode("none");
    showToast("Invitation sent");
    await load();
  }

  async function saveThreshold() {
    setSaving(true);
    const response = await fetch("/api/held", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threshold_days: Number(threshold) }),
    });
    setSaving(false);
    if (!response.ok) {
      showToast("Couldn't update, try again");
      return;
    }
    setSheetMode("none");
    showToast("Quiet window updated");
    await load();
  }

  const holdingCount = data?.holding.length ?? 0;
  const maxWatchers = data?.max_watchers ?? 5;
  const isFull = holdingCount >= maxWatchers;

  return (
    <AppShell>
      <BrandBar />

      <div className="px-5 pb-28 pt-8">
        <Eyebrow>held · the small circle</Eyebrow>
        <Headline className="mt-2">The few who&apos;d notice.</Headline>

        {loading && <HeldPageSkeleton />}

        {error && (
          <p className="mt-10 font-inter text-sm italic text-terracotta-deep" role="alert">
            {error}
          </p>
        )}

        {data && !loading && (
          <div className="mt-5 space-y-7">
            <p className="font-inter text-sm italic leading-relaxed text-ink">
              If you go quiet for about <strong>{data.quiet_threshold_days} days</strong>, KinMatch will let your circle know.{" "}
              <button
                type="button"
                onClick={() => setSheetMode("threshold")}
                className="text-terracotta underline decoration-terracotta/60 underline-offset-2"
              >
                adjust
              </button>
            </p>

            {holdingCount === 0 ? (
              <EmptyHeldState onAdd={() => setSheetMode("add")} />
            ) : (
              <section>
                <Eyebrow className="mb-3">
                  your circle · {holdingCount} of {maxWatchers}
                </Eyebrow>
                <ul>
                  {data.holding.map((entry, index) => (
                    <li
                      key={entry.relationship_id}
                      className={index === data.holding.length - 1 ? "" : "border-b border-ink/[0.08]"}
                    >
                      <WatcherRow
                        entry={entry}
                        onMore={() => {
                          setSelected(entry);
                          setSheetMode("actions");
                        }}
                      />
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={isFull}
                  onClick={() => setSheetMode("add")}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/[0.25] px-4 py-4 font-sans text-xs font-medium text-ink-soft disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  {isFull
                    ? "Your circle is full · remove someone to make room"
                    : "Add someone to your circle"}
                </button>

                <p className="mt-6 text-center font-inter text-xs italic text-ink-soft">
                  {data.recent_events[0]
                    ? `Last triggered: ${timeAgo(data.recent_events[0].occurred_at)}.`
                    : "Last triggered: never. You've stayed in rhythm."}
                </p>
              </section>
            )}
          </div>
        )}
      </div>

      <BottomNav heldBadge={holdingCount > 0} />
      {toast && (
        <p className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-40px)] max-w-[420px] -translate-x-1/2 rounded-sm bg-ink px-4 py-3 text-center font-inter text-sm text-white shadow-lg">
          {toast}
        </p>
      )}
      {data && (
        <HeldSheet
          mode={sheetMode}
          selected={selected}
          data={data}
          selectedFriendId={selectedFriendId}
          threshold={threshold}
          saving={saving}
          setupMessage={setupMessage}
          onSelectFriend={(friendId) => {
            setSelectedFriendId(friendId);
            const friend = data.eligible_friends.find((item) => item.id === friendId);
            if (friend) {
              setSetupMessage(defaultInvitationMessage(friend.name, threshold));
            }
          }}
          onSetupMessage={setSetupMessage}
          onThreshold={setThreshold}
          onClose={() => setSheetMode("none")}
          onRemove={() => setSheetMode("remove")}
          onArchive={() => void archiveSelected()}
          onResend={() => void resendSelected()}
          onInvite={() => void inviteFriend()}
          onSaveThreshold={() => void saveThreshold()}
        />
      )}
    </AppShell>
  );
}

function EmptyHeldState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-ink/[0.12] bg-cream-deep/40 p-5 text-center">
      <Subhead className="text-center">
        Pick the small circle who should notice if you go quiet.
      </Subhead>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-terracotta px-6 py-3 font-sans text-sm font-bold text-black"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Add someone to your circle
      </button>
    </div>
  );
}

function WatcherRow({
  entry,
  onMore,
}: {
  entry: HeldFriendEntry;
  onMore: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <MiniAvatar
        name={entry.name}
        colorHex={entry.avatar_color_hex}
        initials={entry.avatar_initials}
        size="sm"
      />
      <Link href={`/friends/${entry.friend_id}`} className="min-w-0 flex-1">
        <p className="truncate font-sans text-[15px] font-medium text-ink">
          {formatDisplayName(entry.name)}
        </p>
        <p className="font-inter text-[12px] text-ink-soft">
          {statusLine(entry)}
        </p>
      </Link>
      <button
        type="button"
        onClick={onMore}
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink/40"
        aria-label={`Manage ${entry.name}`}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function HeldSheet({
  mode,
  selected,
  data,
  selectedFriendId,
  threshold,
  setupMessage,
  saving,
  onSelectFriend,
  onSetupMessage,
  onThreshold,
  onClose,
  onRemove,
  onArchive,
  onResend,
  onInvite,
  onSaveThreshold,
}: {
  mode: SheetMode;
  selected: HeldFriendEntry | null;
  data: HeldResponse;
  selectedFriendId: string | null;
  threshold: string;
  setupMessage: string;
  saving: boolean;
  onSelectFriend: (id: string) => void;
  onSetupMessage: (value: string) => void;
  onThreshold: (value: string) => void;
  onClose: () => void;
  onRemove: () => void;
  onArchive: () => void;
  onResend: () => void;
  onInvite: () => void;
  onSaveThreshold: () => void;
}) {
  if (mode === "none") return null;
  const name = selected ? formatDisplayName(selected.name) : "";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 px-3 pb-3">
      <div className="w-full max-w-[456px] rounded-[28px] bg-cream p-5 shadow-2xl">
        {mode === "actions" && selected && (
          <>
            <p className="mb-5 text-center font-sans text-[15px] font-medium uppercase tracking-[0.16em] text-ink-soft">
              about {name}
            </p>
            <Link
              href={`/friends/${selected.friend_id}`}
              className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 font-sans text-base font-semibold text-ink hover:bg-ink/[0.04]"
            >
              <UserCircle className="h-4 w-4 text-ink-soft" aria-hidden />
              View {name}&apos;s profile
            </Link>
            {selected.status === "pending" && (
              <button
                type="button"
                onClick={onResend}
                disabled={saving}
                className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left font-sans text-base font-semibold text-ink hover:bg-ink/[0.04]"
              >
                <Mail className="h-4 w-4 text-ink-soft" aria-hidden />
                Resend invitation
              </button>
            )}
            <div className="my-4 h-px bg-ink/[0.12]" />
            <button
              type="button"
              onClick={onRemove}
              className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left font-sans text-base font-semibold text-terracotta-deep hover:bg-ink/[0.04]"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Remove from Held
            </button>
            <div className="my-4 h-px bg-ink/[0.12]" />
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl px-4 py-3 text-center font-sans text-base font-semibold text-ink/60"
            >
              Cancel
            </button>
          </>
        )}

        {mode === "remove" && selected && (
          <div className="space-y-4 text-center">
            <h2 className="font-sans text-xl font-medium text-ink">
              Remove {name} from your Held circle?
            </h2>
            <p className="font-inter text-xs italic leading-[1.5] text-[rgba(31,26,20,0.75)]">
              KinMatch will no longer notify them if you go quiet. They won&apos;t
              be told you removed them, it&apos;ll just stop.
            </p>
            <button
              type="button"
              onClick={onArchive}
              disabled={saving}
              className="w-full rounded-sm bg-terracotta-deep px-6 py-3 font-sans text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? "Removing…" : `Remove ${name}`}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-sm border-2 border-terracotta px-6 py-3 font-sans text-sm font-bold text-ink"
            >
              Cancel
            </button>
          </div>
        )}

        {mode === "add" && (
          <div className="space-y-5">
            <div className="space-y-2 text-center">
              <h2 className="font-sans text-xl font-medium text-ink">
                Add to your circle
              </h2>
              <p className="font-inter text-xs italic leading-[1.5] text-ink-soft">
                Pick someone from your tribe. They&apos;ll get a short email
                letting them know they&apos;re in your Held circle.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.eligible_friends.map((friend) => (
                <FriendPill
                  key={friend.id}
                  friend={friend}
                  selected={selectedFriendId === friend.id}
                  onClick={() => onSelectFriend(friend.id)}
                />
              ))}
              {data.eligible_friends.length === 0 && (
                <p className="font-inter text-sm italic text-ink-soft">
                  Everyone available is already in your circle.
                </p>
              )}
            </div>
            <label className="block space-y-2">
              <span className="font-sans text-[15px] font-medium uppercase tracking-[0.12em] text-ink-soft">
                Note they&apos;ll receive
              </span>
              <textarea
                value={setupMessage}
                onChange={(event) => onSetupMessage(event.target.value)}
                placeholder="Select someone to preview the invitation note."
                className="min-h-32 w-full resize-none rounded-xl border border-ink/[0.2] bg-cream px-3 py-2 font-inter text-sm italic leading-relaxed text-ink placeholder:text-ink-soft/50"
              />
            </label>
            <button
              type="button"
              onClick={onInvite}
              disabled={!selectedFriendId || setupMessage.trim().length < 20 || saving}
              className="w-full rounded-sm bg-terracotta px-6 py-3 font-sans text-sm font-bold text-black disabled:opacity-50"
            >
              {saving ? "Sending…" : "Send invitation →"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-sm border-2 border-terracotta px-6 py-3 font-sans text-sm font-bold text-ink"
            >
              Cancel
            </button>
          </div>
        )}

        {mode === "threshold" && (
          <div className="space-y-5">
            <div className="space-y-2 text-center">
              <h2 className="font-sans text-xl font-medium text-ink">
                Adjust quiet window
              </h2>
              <p className="font-inter text-xs italic leading-[1.5] text-ink-soft">
                Choose how long you can be quiet before KinMatch gives your
                circle a gentle heads-up.
              </p>
            </div>
            <select
              value={threshold}
              onChange={(event) => onThreshold(event.target.value)}
              className="w-full rounded-xl border border-ink/[0.2] bg-cream px-3 py-3 font-inter text-sm text-ink"
            >
              {[7, 10, 14, 21, 30].map((days) => (
                <option key={days} value={days}>
                  About {days} days
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onSaveThreshold}
              disabled={saving}
              className="w-full rounded-sm bg-terracotta px-6 py-3 font-sans text-sm font-bold text-black disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save quiet window"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-sm border-2 border-terracotta px-6 py-3 font-sans text-sm font-bold text-ink"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FriendPill({
  friend,
  selected,
  onClick,
}: {
  friend: {
    id: string;
    name: string;
    avatar_color: AvatarColor;
    avatar_color_hex?: string | null;
    avatar_initials?: string | null;
  };
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-sm border-2 px-3 py-2 font-sans text-sm font-bold ${
        selected
          ? "border-terracotta bg-terracotta/10 text-ink"
          : "border-hairline text-ink"
      }`}
    >
      <MiniAvatar
        name={friend.name}
        colorHex={friend.avatar_color_hex}
        initials={friend.avatar_initials}
        size="sm"
      />
      {formatDisplayName(friend.name)}
    </button>
  );
}
