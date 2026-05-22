"use client";

import { Eyebrow } from "@/components/brand";
import { ContinueButton } from "@/components/onboarding/ContinueButton";
import { isNativePlatform, openAppSettings } from "@/lib/audio/platform";
import type { MicSetupStatus } from "@/hooks/useVoiceNotesMicSetup";

const REFLECTION_COPY_CLASS =
  "font-inter text-sm italic leading-[1.5] text-[rgba(31,26,20,0.65)]";

type VoiceNotesMicSetupSectionProps = {
  micStatus: MicSetupStatus;
  micMessage: string | null;
  onSetup?: () => void | Promise<void>;
  setupDisabled?: boolean;
  className?: string;
};

export function VoiceNotesMicSetupSection({
  micStatus,
  micMessage,
  onSetup,
  setupDisabled = false,
  className,
}: VoiceNotesMicSetupSectionProps) {
  return (
    <section
      className={
        className ??
        "mb-8 w-full max-w-[340px] space-y-3 rounded-2xl border border-ink/[0.12] bg-cream-deep/45 p-4"
      }
    >
      <Eyebrow>Voice notes</Eyebrow>
      <p className="font-sans text-base font-medium text-ink">
        Set up voice notes before the first one.
      </p>
      <p className={REFLECTION_COPY_CLASS}>
        Your phone will ask before anything is recorded. We&apos;ll only use the
        microphone when you start a note.
      </p>
      {micMessage && (
        <p
          className={
            micStatus === "ready"
              ? "font-inter text-sm italic text-ink-soft"
              : "font-inter text-sm italic text-terracotta-deep"
          }
          role={micStatus === "ready" ? "status" : "alert"}
        >
          {micMessage}
        </p>
      )}
      {micStatus === "blocked" && isNativePlatform() && (
        <button
          type="button"
          onClick={() => void openAppSettings()}
          className="font-inter text-sm text-terracotta underline decoration-terracotta/60 underline-offset-2"
        >
          Open settings
        </button>
      )}
      {onSetup && (
        <ContinueButton
          variant="terracotta"
          disabled={setupDisabled || micStatus === "requesting"}
          onClick={() => void onSetup()}
          className="!mt-2"
        >
          {micStatus === "requesting" ? "Asking…" : "Set up voice notes →"}
        </ContinueButton>
      )}
    </section>
  );
}
