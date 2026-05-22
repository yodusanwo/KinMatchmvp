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
    <div className={`space-y-1 text-center ${className ?? ""}`}>
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
        Use Voice Memos, then add it here →
      </button>
      <p className="font-inter text-xs italic leading-relaxed text-ink-soft">
        Voice Memos is the built-in recording app on iPhone — useful when Safari
        won&apos;t turn on the mic.
      </p>
    </div>
  );
}
