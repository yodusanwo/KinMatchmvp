"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDisplayName } from "@/lib/names/format";

type MemorySearchInputProps = {
  onSearchChange: (query: string) => void;
  friendName: string;
};

export function MemorySearchInput({
  onSearchChange,
  friendName,
}: MemorySearchInputProps) {
  const [value, setValue] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, onSearchChange]);

  const handleClear = () => {
    setValue("");
  };

  const name = formatDisplayName(friendName);

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search
          className="absolute left-3 h-4 w-4 text-ink-soft"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Search notes about ${name}...`}
          className={cn(
            "w-full rounded-xl border border-ink/[0.12] bg-cream/50 py-2.5 pl-9 pr-9 font-inter text-sm text-ink",
            "placeholder:italic placeholder:text-ink-soft/60",
            "focus:border-terracotta/40 focus:outline-none focus:ring-1 focus:ring-terracotta/20",
            "transition-colors"
          )}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-ink-soft/10 text-ink-soft transition-colors hover:bg-ink-soft/20"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" strokeWidth={2} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
