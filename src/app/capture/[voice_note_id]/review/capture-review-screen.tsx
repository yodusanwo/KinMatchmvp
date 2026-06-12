"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import { BrandBar, Eyebrow, Headline, PrimaryButton, Subhead } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import { MEMORY_CATEGORIES, MEMORY_MODAL_CATEGORIES } from "@/lib/memories/categories";
import { formatDisplayName } from "@/lib/names/format";
import type { MemoryCategory } from "@/lib/memories/types";
import type { CaptureVoiceNoteContext } from "@/lib/capture/context";
import type { ExtractedCaptureItem } from "@/lib/ai/extract-memories";
import { cn } from "@/lib/cn";

type EditableItem = ExtractedCaptureItem & { checked: boolean };

type CaptureReviewScreenProps = {
  voiceNote: CaptureVoiceNoteContext;
  initialItems: ExtractedCaptureItem[];
};

function defaultChecked(confidence: ExtractedCaptureItem["confidence"]) {
  return confidence === "high" || confidence === "medium";
}

export function CaptureReviewScreen({
  voiceNote,
  initialItems,
}: CaptureReviewScreenProps) {
  const router = useRouter();
  const name = formatDisplayName(voiceNote.friend_name);
  const [items, setItems] = useState<EditableItem[]>(
    initialItems.map((item) => ({
      ...item,
      checked: defaultChecked(item.confidence),
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkedCount = useMemo(
    () => items.filter((item) => item.checked && item.text.trim()).length,
    [items]
  );

  function updateItem(index: number, next: Partial<EditableItem>) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...next } : item
      )
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        text: "",
        category: "current",
        confidence: "medium",
        checked: true,
      },
    ]);
  }

  async function save() {
    const selected = items
      .filter((item) => item.checked && item.text.trim())
      .map((item) => ({
        text: item.text.trim(),
        category: item.category,
        event_date: item.event_date,
      }));
    if (selected.length === 0) return;

    setSaving(true);
    setError(null);

    const response = await fetch(`/api/capture/${voiceNote.id}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: selected }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setSaving(false);
      setError((data as { error?: string }).error ?? "Could not save details.");
      return;
    }

    router.push(`/friends/${voiceNote.friend_id}?capture_saved=${selected.length}`);
  }

  async function skip() {
    await fetch(`/api/capture/${voiceNote.id}/skip`, { method: "POST" });
    router.push(`/friends/${voiceNote.friend_id}`);
  }

  return (
    <AppShell>
      <BrandBar />
      <div className="flex min-h-screen flex-col px-5 pb-10 pt-4">
        <Link
          href={`/capture/${voiceNote.id}`}
          className="font-inter text-sm text-terracotta underline underline-offset-2"
        >
          ← Back
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <MiniAvatar
            name={voiceNote.friend_name}
            colorHex={voiceNote.friend_avatar_color_hex}
            initials={voiceNote.friend_avatar_initials}
            size="md"
          />
          <div>
            <Eyebrow>capture from {name}</Eyebrow>
            <Headline className="text-lg">Here&apos;s what KinMatch heard.</Headline>
          </div>
        </div>

        <Subhead className="mt-6">
          Pick what&apos;s worth remembering. You can edit anything before saving.
        </Subhead>

        <div className="mt-5 space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-ink/[0.12] bg-cream-deep/60 p-5">
              <p className="font-inter text-sm italic leading-relaxed text-ink-soft">
                Nothing specific to save yet. KinMatch will try again tomorrow.
              </p>
            </div>
          ) : (
            items.map((item, index) => {
              const category = MEMORY_CATEGORIES[item.category];
              const Icon = category.icon;
              return (
                <article
                  key={`${item.text}-${index}`}
                  className={cn(
                    "rounded-2xl bg-cream-deep/70 p-4 transition-opacity",
                    !item.checked && "opacity-55"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => updateItem(index, { checked: !item.checked })}
                      className={cn(
                        "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-xs border transition-colors",
                        item.checked
                          ? "border-terracotta bg-terracotta text-white"
                          : "border-hairline-strong bg-cream text-transparent"
                      )}
                      aria-label={item.checked ? "Remove detail" : "Save detail"}
                    >
                      <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </button>
                    <div className="min-w-0 flex-1">
                      <textarea
                        value={item.text}
                        onChange={(event) =>
                          updateItem(index, { text: event.target.value })
                        }
                        className="min-h-12 w-full resize-none bg-transparent font-inter text-sm font-medium leading-relaxed text-ink focus:outline-none"
                      />
                      <label className="mt-2 flex items-center gap-2 font-inter text-xs italic text-ink-soft">
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                        <select
                          value={item.category}
                          onChange={(event) =>
                            updateItem(index, {
                              category: event.target.value as MemoryCategory,
                            })
                          }
                          className="bg-transparent focus:outline-none"
                        >
                          {MEMORY_MODAL_CATEGORIES.map((categoryId) => (
                            <option key={categoryId} value={categoryId}>
                              {MEMORY_CATEGORIES[categoryId].title(formatDisplayName(voiceNote.friend_name)).toLowerCase()}
                            </option>
                          ))}
                          <option value="other">other</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="mt-6 text-center font-inter text-sm text-terracotta underline underline-offset-2"
        >
          <Plus className="mr-1 inline h-3.5 w-3.5" aria-hidden />
          add another detail
        </button>

        {error && (
          <p className="mt-3 font-inter text-sm italic text-terracotta-deep">
            {error}
          </p>
        )}

        <div className="mt-auto space-y-4 pt-8">
          <PrimaryButton
            type="button"
            disabled={saving || checkedCount === 0}
            onClick={() => void save()}
          >
            {saving
              ? "Saving…"
              : checkedCount > 0
                ? `Save ${checkedCount} to ${name}'s profile →`
                : "Pick at least one to save"}
          </PrimaryButton>
          <button
            type="button"
            onClick={() => void skip()}
            className="block w-full text-center font-inter text-sm text-ink-soft underline underline-offset-2"
          >
            skip, nothing to save
          </button>
        </div>
      </div>
    </AppShell>
  );
}
