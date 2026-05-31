"use client";

import { PrimaryButton } from "@/components/brand";
import type { MicStatus } from "@/hooks/useVoiceRecorder";
import type { MicErrorInfo } from "@/lib/audio/mic-permission";
import { micSettingsHint } from "@/lib/audio/mic-permission";

type MicPermissionCardProps = {
  micStatus: MicStatus;
  micError: MicErrorInfo | null;
  onEnable: () => void;
  onUsePhoneRecorder?: () => void;
  disabled?: boolean;
};

export function MicPermissionCard({
  micStatus,
  micError,
  onEnable,
  onUsePhoneRecorder,
  disabled,
}: MicPermissionCardProps) {
  const showFileFallback =
    micStatus === "blocked" ||
    micStatus === "unsupported" ||
    micError?.kind === "denied";

  return (
    <section className="w-full max-w-[320px] space-y-4 rounded-2xl border border-ink/[0.12] bg-cream-deep/60 p-4 text-center">
      <p className="font-sans text-base font-medium text-ink">
        Enable the microphone first.
      </p>
      <p className="font-inter text-sm italic leading-relaxed text-ink-soft">
        Your phone will ask before anything is recorded. We&apos;ll only use the
        microphone when you start a note.
      </p>

      {micError && (
        <p
          className="font-inter text-sm italic text-terracotta-deep"
          role="alert"
        >
          {micError.message}
          {micError.settingsHint ? ` ${micError.settingsHint}` : null}
        </p>
      )}

      {!micError && micStatus === "ready" && (
        <p className="font-inter text-sm italic text-ink-soft" role="status">
          Voice notes are ready.
        </p>
      )}

      {micStatus !== "ready" && (
        <PrimaryButton
          type="button"
          disabled={disabled || micStatus === "requesting"}
          onClick={onEnable}
          className="w-full"
        >
          {micStatus === "requesting" ? "Asking…" : "Enable microphone →"}
        </PrimaryButton>
      )}

      {showFileFallback && onUsePhoneRecorder && (
        <button
          type="button"
          disabled={disabled}
          onClick={onUsePhoneRecorder}
          className="font-inter text-sm text-terracotta underline decoration-terracotta/60 underline-offset-2 disabled:opacity-60"
        >
          Use your phone&apos;s recorder →
        </button>
      )}

      {showFileFallback && !micError?.settingsHint && micSettingsHint() && (
        <p className="font-inter text-xs italic leading-relaxed text-ink-soft">
          {micSettingsHint()}
        </p>
      )}
    </section>
  );
}
