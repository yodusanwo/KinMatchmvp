"use client";

import { ChevronDown } from "lucide-react";
import {
  DATE_EVENT_CONTEXT_FIELDS,
  DATE_EVENT_KINDS,
  dateEventNeedsContext,
  type DateEventKind,
} from "@/lib/memories/date-events";
import { cn } from "@/lib/cn";

const fieldClassName = cn(
  "h-11 w-full rounded-xl border border-ink/[0.2] bg-cream-deep/60",
  "font-inter text-sm text-ink",
  "focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
);

type DatesCaptureFieldsProps = {
  eventKind: DateEventKind;
  eventDate: string;
  context: string;
  friendFirstName: string;
  onEventKindChange: (kind: DateEventKind) => void;
  onEventDateChange: (date: string) => void;
  onContextChange: (context: string) => void;
};

export function DatesCaptureFields({
  eventKind,
  eventDate,
  context,
  friendFirstName,
  onEventKindChange,
  onEventDateChange,
  onContextChange,
}: DatesCaptureFieldsProps) {
  const contextConfig = dateEventNeedsContext(eventKind)
    ? DATE_EVENT_CONTEXT_FIELDS[eventKind]
    : null;

  return (
    <div className="mt-6 space-y-3">
      <p className="font-inter text-xs text-ink-soft">
        Pick what it is and when — we&apos;ll remember it for {friendFirstName}.
      </p>

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <select
            value={eventKind}
            onChange={(event) =>
              onEventKindChange(event.target.value as DateEventKind)
            }
            className={cn(fieldClassName, "appearance-none pl-3 pr-9")}
            aria-label="Type of date"
          >
            {DATE_EVENT_KINDS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
            aria-hidden
          />
        </div>

        <input
          type="date"
          value={eventDate}
          onChange={(event) => onEventDateChange(event.target.value)}
          className={cn(fieldClassName, "min-w-0 flex-1 px-3")}
          aria-label="Date"
        />
      </div>

      {contextConfig && (
        <label className="block space-y-1.5">
          <span className="font-inter text-xs text-ink-soft">
            {contextConfig.label}
          </span>
          <input
            type="text"
            value={context}
            onChange={(event) => onContextChange(event.target.value)}
            placeholder={contextConfig.placeholder(friendFirstName)}
            className={cn(
              fieldClassName,
              "px-3 italic placeholder:text-ink-soft/50"
            )}
          />
        </label>
      )}
    </div>
  );
}
