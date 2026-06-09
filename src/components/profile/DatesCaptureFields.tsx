"use client";

import { ChevronDown } from "lucide-react";
import {
  DATE_EVENT_KINDS,
  getDateEventContextConfig,
  type DateEventKind,
} from "@/lib/memories/date-events";
import { cn } from "@/lib/cn";

const fieldClassName = cn(
  "h-11 w-full rounded-xl border border-ink/[0.2] bg-cream-deep/60",
  "font-inter text-sm text-ink",
  "focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
);

const MONTH_OPTIONS = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

function daysInMonth(month: string): number {
  if (!month) return 31;
  // Year 2000 is intentional so February includes leap day without asking for a year.
  return new Date(2000, Number(month), 0).getDate();
}

type DatesCaptureFieldsProps = {
  eventKind: DateEventKind;
  eventMonth: string;
  eventDay: string;
  context: string;
  friendFirstName: string;
  onEventKindChange: (kind: DateEventKind) => void;
  onEventMonthChange: (month: string) => void;
  onEventDayChange: (day: string) => void;
  onContextChange: (context: string) => void;
};

export function DatesCaptureFields({
  eventKind,
  eventMonth,
  eventDay,
  context,
  friendFirstName,
  onEventKindChange,
  onEventMonthChange,
  onEventDayChange,
  onContextChange,
}: DatesCaptureFieldsProps) {
  const contextConfig = getDateEventContextConfig(eventKind);
  const dayOptions = Array.from({ length: daysInMonth(eventMonth) }, (_, index) => {
    const value = String(index + 1).padStart(2, "0");
    return { value, label: String(index + 1) };
  });

  function handleMonthChange(nextMonth: string) {
    const maxDay = daysInMonth(nextMonth);
    onEventMonthChange(nextMonth);
    if (eventDay && Number(eventDay) > maxDay) {
      onEventDayChange("");
    }
  }

  function handleDayChange(nextDay: string) {
    onEventDayChange(nextDay);
  }

  return (
    <div className="mt-6 space-y-3">
      <p className="font-inter text-xs text-ink-soft">
        Pick what it is and the month/day, no year needed.
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

        <div className="flex min-w-0 flex-1 gap-2">
          <div className="relative min-w-0 flex-[1.2]">
            <select
              value={eventMonth}
              onChange={(event) => handleMonthChange(event.target.value)}
              className={cn(
                fieldClassName,
                "relative z-10 appearance-none pl-3 pr-8"
              )}
              aria-label="Month"
            >
              <option value="">Month</option>
              {MONTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
              aria-hidden
            />
          </div>

          <div className="relative min-w-0 flex-1">
            <select
              value={eventDay}
              onChange={(event) => handleDayChange(event.target.value)}
              disabled={!eventMonth}
              className={cn(
                fieldClassName,
                "appearance-none pl-3 pr-8 disabled:opacity-50"
              )}
              aria-label="Day"
            >
              <option value="">Day</option>
              {dayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
              aria-hidden
            />
          </div>
        </div>
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
