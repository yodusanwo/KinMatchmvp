"use client";

import { useRef } from "react";

type AudioFileCaptureFallbackProps = {
  onFileSelected: (file: File) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
};

/** Opens the device recorder or audio picker when in-browser mic access is blocked. */
export function AudioFileCaptureFallback({
  onFileSelected,
  disabled = false,
  className,
}: AudioFileCaptureFallbackProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        capture
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void onFileSelected(file);
          }
          event.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="font-inter text-sm text-terracotta underline decoration-terracotta/60 underline-offset-2 disabled:text-ink-soft"
      >
        Record in Voice Memos instead →
      </button>
    </div>
  );
}
