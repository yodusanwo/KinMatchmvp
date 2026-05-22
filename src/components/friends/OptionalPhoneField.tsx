"use client";

import { firstName } from "@/lib/memories/categories";
import { cn } from "@/lib/cn";

type OptionalPhoneFieldProps = {
  friendName: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
};

export function OptionalPhoneField({
  friendName,
  value,
  onChange,
  className,
  id = "friend-phone",
}: OptionalPhoneFieldProps) {
  const name = firstName(friendName) || "them";

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className="font-sans text-xs font-medium text-ink-soft"
      >
        Phone (optional)
      </label>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        pattern="[0-9+\-\s()]*"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="+1 (312) 632-0027"
        className="w-full rounded-xl border border-ink/[0.35] bg-cream px-4 py-3 font-inter text-base text-ink placeholder:text-ink-soft/70 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
      />
      <p className="font-inter text-xs italic leading-relaxed text-ink-soft">
        Adds one-tap voice note sending. {name}&apos;s number stays on their
        KinMatch profile.
      </p>
    </div>
  );
}
