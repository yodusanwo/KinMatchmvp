"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import {
  BrandBar,
  Eyebrow,
  Headline,
  PrimaryButton,
  Subhead,
} from "@/components/brand";
import { DatesCaptureFields } from "@/components/profile/DatesCaptureFields";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import type { AvatarColor } from "@/lib/onboarding/types";
import { fetchJson } from "@/lib/api/fetch-client";
import type { MemoryCategory, MemoryNote } from "@/lib/api/types";
import {
  MEMORY_CATEGORIES,
  MEMORY_MODAL_CATEGORIES,
} from "@/lib/memories/categories";
import {
  buildDateNoteText,
  dateEventNeedsContext,
  type DateEventKind,
} from "@/lib/memories/date-events";
import { formatDisplayName } from "@/lib/names/format";
import { cn } from "@/lib/cn";

type MemoryCaptureModalProps = {
  open: boolean;
  friendId: string;
  friendName: string;
  avatarColor?: AvatarColor;
  colorHex?: string | null;
  initials?: string | null;
  initialCategory?: MemoryCategory;
  onClose: () => void;
  onSaved: (notes: MemoryNote[]) => void;
};

const textareaClassName = cn(
  "min-h-[200px] w-full resize-none rounded-2xl border border-ink/[0.2] bg-cream-deep/60 px-4 py-4",
  "font-inter text-base italic leading-relaxed text-ink placeholder:text-ink-soft/50",
  "focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
);

function noteTextForSave(
  category: MemoryCategory,
  name: string,
  text: string,
  dateEventKind: DateEventKind,
  dateEventContext: string
): string {
  if (category === "dates") {
    return buildDateNoteText(name, dateEventKind, dateEventContext);
  }
  return text.trim();
}

function canSaveNote(
  category: MemoryCategory,
  text: string,
  dateEventKind: DateEventKind,
  dateEventContext: string,
  name: string
): boolean {
  const noteText = noteTextForSave(
    category,
    name,
    text,
    dateEventKind,
    dateEventContext
  );
  if (noteText.length < 2) return false;
  if (
    category === "dates" &&
    dateEventNeedsContext(dateEventKind) &&
    dateEventContext.trim().length < 2
  ) {
    return false;
  }
  return true;
}

export function MemoryCaptureModal({
  open,
  friendId,
  friendName,
  colorHex,
  initials,
  initialCategory,
  onClose,
  onSaved,
}: MemoryCaptureModalProps) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<MemoryCategory>("current");
  const [dateEventKind, setDateEventKind] = useState<DateEventKind>("birthday");
  const [dateEventContext, setDateEventContext] = useState("");
  const [eventMonth, setEventMonth] = useState("");
  const [eventDay, setEventDay] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const saveInFlight = useRef(false);

  useEffect(() => {
    if (!open) return;
    setText("");
    setCategory(initialCategory ?? "current");
    setDateEventKind("birthday");
    setDateEventContext("");
    setEventMonth("");
    setEventDay("");
    setStatus("idle");
    setErrorMessage(null);
    saveInFlight.current = false;
  }, [open, initialCategory]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  async function handleSaveNote() {
    const name = formatDisplayName(friendName);
    const trimmed = noteTextForSave(
      category,
      name,
      text,
      dateEventKind,
      dateEventContext
    );
    if (!canSaveNote(category, text, dateEventKind, dateEventContext, name)) {
      return;
    }
    if (saveInFlight.current) return;

    saveInFlight.current = true;
    setStatus("saving");
    setErrorMessage(null);

    const body: {
      text: string;
      category: MemoryCategory;
      event_date?: string;
    } = { text: trimmed, category };

    if (category === "dates" && eventMonth && eventDay) {
      body.event_date = `2000-${eventMonth}-${eventDay}`;
    }

    const result = await fetchJson<MemoryNote>(
      `/api/friends/${friendId}/memories`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!result.ok) {
      setStatus("error");
      setErrorMessage(result.error);
      saveInFlight.current = false;
      return;
    }

    onSaved([result.data]);
    onClose();
  }

  if (!open) return null;

  const name = formatDisplayName(friendName);
  const placeholder =
    MEMORY_CATEGORIES[category].capturePlaceholder(name);
  const isDates = category === "dates";
  const saveEnabled = canSaveNote(
    category,
    text,
    dateEventKind,
    dateEventContext,
    name
  );

  function handleDateEventKindChange(kind: DateEventKind) {
    setDateEventKind(kind);
    if (!dateEventNeedsContext(kind)) {
      setDateEventContext("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-cream-deep">
      <div
        className="flex h-full w-full max-w-[480px] flex-col bg-cream shadow-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="memory-capture-title"
      >
        <BrandBar />
        <div className="flex items-center border-b border-ink/[0.12] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={status === "saving"}
            className="font-inter text-sm text-terracotta underline underline-offset-2 disabled:opacity-50"
          >
            ← Back
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-8 pt-6">
          <div className="flex items-center gap-3">
            <MiniAvatar name={friendName} colorHex={colorHex} initials={initials} size="sm" />
            <Eyebrow>A note about {friendName}</Eyebrow>
          </div>

          <div id="memory-capture-title">
            <Headline as="h2" className="mt-6">
              {isDates ? "What date should we remember?" : "What's worth remembering?"}
            </Headline>
          </div>
          <Subhead className="mt-2">
            {isDates
              ? "We'll surface it when it's coming up."
              : "Anything small or specific. KinMatch will surface it at the right moment."}
          </Subhead>

          <div className="-mx-5 mt-5 overflow-x-auto px-5">
            <div className="flex gap-2 pb-1">
              {MEMORY_MODAL_CATEGORIES.map((categoryId) => {
                const config = MEMORY_CATEGORIES[categoryId];
                const Icon = config.icon;
                const selected = category === categoryId;

                return (
                  <button
                    key={categoryId}
                    type="button"
                    onClick={() => setCategory(categoryId)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-1.5 font-inter text-xs font-bold transition-colors",
                      selected
                        ? "bg-ink text-white"
                        : "border border-hairline text-ink-soft"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {config.chipLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {isDates ? (
            <DatesCaptureFields
              eventKind={dateEventKind}
              eventMonth={eventMonth}
              eventDay={eventDay}
              context={dateEventContext}
              friendFirstName={name}
              onEventKindChange={handleDateEventKindChange}
              onEventMonthChange={setEventMonth}
              onEventDayChange={setEventDay}
              onContextChange={setDateEventContext}
            />
          ) : (
            <div className="relative mt-6">
              <textarea
                key={category}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={placeholder}
                rows={8}
                className={cn(textareaClassName, "pr-12")}
              />
              <button
                type="button"
                disabled
                title="Voice notes coming soon"
                className="absolute bottom-4 right-4 text-ink-soft/40"
                aria-label="Add note by voice (coming soon)"
              >
                <Mic className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
          )}

          {errorMessage && (
            <p
              className="mt-3 font-inter text-sm italic text-terracotta-deep"
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          <div className="mt-6 space-y-4">
            <PrimaryButton
              type="button"
              disabled={!saveEnabled || status === "saving"}
              onClick={() => void handleSaveNote()}
              className="w-full"
            >
              {status === "saving"
                ? "Saving…"
                : `Save to ${friendName}'s notes`}
            </PrimaryButton>
            <p className="text-center">
              <button
                type="button"
                onClick={onClose}
                disabled={status === "saving"}
                className="font-inter text-sm text-terracotta underline decoration-terracotta/60 underline-offset-2 disabled:opacity-50"
              >
                Cancel
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
