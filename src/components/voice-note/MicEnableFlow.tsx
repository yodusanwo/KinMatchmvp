"use client";

import { useCallback } from "react";
import { PrimaryButton, Subhead } from "@/components/brand";
import type { MicStatus } from "@/hooks/useVoiceRecorder";
import type { MicAccessError } from "@/lib/audio/mic-permission";
import { isIOS } from "@/lib/audio/mic-permission";
import { isNativeApp } from "@/lib/audio/native-platform";
import { firstName } from "@/lib/memories/categories";

// Backwards-compatible alias so existing callers using MicErrorInfo keep working
export type MicErrorInfo = MicAccessError;

type MicEnableFlowProps = {
  friendName: string;
  micStatus: MicStatus;
  micError: MicAccessError | null;
  onEnable: () => Promise<boolean>;
  /**
   * Called when the user opts to skip voice notes and reach out via text instead.
   * If provided, shown as a "Text [friend] directly" link in the denied state.
   */
  onTextInstead?: () => void;
  /**
   * Kept for backwards compatibility. No longer renders any UI.
   * The file-capture fallback was removed in favor of the text-directly path.
   */
  onUsePhoneRecorder?: () => void;
  disabled?: boolean;
};

export function MicEnableFlow({
  friendName,
  micStatus,
  micError,
  onEnable,
  onTextInstead,
  disabled,
}: MicEnableFlowProps) {
  const name = firstName(friendName);

  // Show the Path 5 fallback when the mic is blocked or otherwise can't be used.
  const isBlocked =
    micStatus === "blocked" ||
    micStatus === "unsupported" ||
    micError?.kind === "denied" ||
    micError?.kind === "insecure";

  const handleEnable = useCallback(async () => {
    console.log("[MicEnableFlow] Enable microphone tapped");
    await onEnable();
  }, [onEnable]);

  const enableLabel =
    micStatus === "requesting"
      ? "Asking…"
      : isBlocked
        ? "Try again →"
        : "Enable microphone →";

  return (
    <section className="w-full max-w-[320px] space-y-4 rounded-2xl border border-ink/[0.12] bg-cream-deep/60 p-4 text-center">
      <p className="font-sans text-base font-medium text-ink">
        Record a note for {name}.
      </p>

      {!isBlocked && (
        <Subhead className="text-sm">
          {isNativeApp()
            ? "KinMatch will ask for your microphone — tap Allow."
            : isIOS()
              ? "Safari will ask for your microphone — tap Allow when you see the prompt."
              : "Your browser will ask before anything is recorded."}
        </Subhead>
      )}

      {isBlocked && (
        <div className="space-y-3 text-left">
          <p className="font-inter text-sm italic leading-relaxed text-ink">
            The microphone&apos;s blocked right now — but {name} is still right
            there.
          </p>
          {onTextInstead && (
            <p className="font-inter text-sm leading-relaxed text-ink">
              You can text {name} directly. KinMatch will note that you reached
              out.
            </p>
          )}
        </div>
      )}

      {isBlocked && onTextInstead && (
        <PrimaryButton type="button" onClick={onTextInstead} className="w-full">
          Text {name} →
        </PrimaryButton>
      )}

      <PrimaryButton
        type="button"
        disabled={disabled || micStatus === "requesting"}
        onClick={() => void handleEnable()}
        className={
          isBlocked && onTextInstead
            ? "w-full bg-transparent text-terracotta shadow-none ring-1 ring-terracotta/40 hover:bg-terracotta/5"
            : "w-full"
        }
      >
        {enableLabel}
      </PrimaryButton>

      {micError && !isBlocked && (
        <p
          className="font-inter text-sm italic text-terracotta-deep"
          role="alert"
        >
          {micError.message}
        </p>
      )}
    </section>
  );
}
