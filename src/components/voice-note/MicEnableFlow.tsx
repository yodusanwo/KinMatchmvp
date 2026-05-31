"use client";

import { useCallback, useState } from "react";
import { PrimaryButton, Subhead } from "@/components/brand";
import { SafariPermissionMock } from "@/components/voice-note/SafariPermissionMock";
import type { MicStatus } from "@/hooks/useVoiceRecorder";
import type { MicErrorInfo } from "@/lib/audio/mic-permission";
import {
  fileCaptureActionLabel,
  fileCaptureHelperText,
  iosSafariFreshPromptSteps,
  isIOS,
  shouldPrimeMicPrompt,
} from "@/lib/audio/mic-permission";
import { isNativeApp } from "@/lib/audio/native-platform";
import { firstName } from "@/lib/memories/categories";

type MicEnableFlowProps = {
  friendName: string;
  micStatus: MicStatus;
  micError: MicErrorInfo | null;
  onEnable: () => Promise<boolean>;
  onUsePhoneRecorder?: () => void;
  disabled?: boolean;
};

type OverlayMode = "waiting" | "denied" | null;

export function MicEnableFlow({
  friendName,
  micStatus,
  micError,
  onEnable,
  onUsePhoneRecorder,
  disabled,
}: MicEnableFlowProps) {
  const [overlay, setOverlay] = useState<OverlayMode>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const name = firstName(friendName);
  const showFileFallback =
    micStatus === "blocked" ||
    micStatus === "unsupported" ||
    micError?.kind === "denied" ||
    micError?.kind === "security";

  const handleEnable = useCallback(async () => {
    setCopyNotice(null);
    if (shouldPrimeMicPrompt()) {
      setOverlay("waiting");
    }

    const granted = await onEnable();

    if (granted) {
      setOverlay(null);
      return;
    }

    if (shouldPrimeMicPrompt()) {
      setOverlay("denied");
    }
  }, [onEnable]);

  const handleCopyLink = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopyNotice("Link copied — paste it in a Private tab.");
    } catch {
      setCopyNotice("Copy the address bar link and open it in a Private tab.");
    }
  }, []);

  const enableLabel =
    micStatus === "requesting"
      ? "Asking Safari…"
      : micStatus === "blocked"
        ? "Try again →"
        : "Enable microphone →";

  return (
    <>
      <section className="w-full max-w-[320px] space-y-4 rounded-2xl border border-ink/[0.12] bg-cream-deep/60 p-4 text-center">
        <p className="font-sans text-base font-medium text-ink">
          Record a note for {name}.
        </p>
        <Subhead className="text-sm">
          {isNativeApp()
            ? "KinMatch will ask for your microphone next — tap Allow."
            : isIOS()
              ? "Safari will pop up and ask — tap Allow when you see it."
              : "Your browser will ask before anything is recorded."}
        </Subhead>

        {micError && overlay !== "denied" && (
          <p
            className="font-inter text-sm italic text-terracotta-deep"
            role="alert"
          >
            {micError.message}
          </p>
        )}

        <PrimaryButton
          type="button"
          disabled={disabled || micStatus === "requesting"}
          onClick={() => void handleEnable()}
          className="w-full"
        >
          {enableLabel}
        </PrimaryButton>

        {showFileFallback && onUsePhoneRecorder && (
          <div className="space-y-2 border-t border-ink/[0.08] pt-4">
            <p className="font-inter text-xs italic text-ink-soft">
              Or import something you already recorded.
            </p>
            <button
              type="button"
              disabled={disabled}
              onClick={onUsePhoneRecorder}
              className="font-inter text-sm text-terracotta underline decoration-terracotta/60 underline-offset-2 disabled:opacity-60"
            >
              {fileCaptureActionLabel()}
            </button>
            {fileCaptureHelperText() && (
              <p className="font-inter text-xs italic leading-relaxed text-ink-soft">
                {fileCaptureHelperText()}
              </p>
            )}
          </div>
        )}
      </section>

      {overlay && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-3 pb-6 pt-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mic-enable-title"
        >
          <div className="w-full max-w-[400px] rounded-[28px] bg-cream p-5 shadow-2xl">
            {overlay === "waiting" ? (
              <div className="space-y-4 text-center">
                <p
                  id="mic-enable-title"
                  className="font-sans text-lg font-medium text-ink"
                >
                  Safari is asking now.
                </p>
                <Subhead className="text-sm">
                  Look for the popup above this card and tap{" "}
                  <span className="not-italic text-ink">Allow</span>.
                </Subhead>
                <SafariPermissionMock highlightAllow />
                <p className="font-inter text-sm italic text-ink-soft">
                  {micStatus === "requesting"
                    ? "Waiting for your answer…"
                    : "Nothing recording yet."}
                </p>
                <button
                  type="button"
                  onClick={() => setOverlay(null)}
                  className="font-inter text-sm text-ink-soft underline underline-offset-2"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p
                    id="mic-enable-title"
                    className="font-sans text-lg font-medium text-ink"
                  >
                    Safari didn&apos;t allow the microphone.
                  </p>
                  <Subhead className="mt-2 text-sm">
                    Safari won&apos;t pop up again on this tab. A Private tab
                    gives you a fresh ask.
                  </Subhead>
                </div>

                <ol className="space-y-3 font-inter text-sm leading-relaxed text-ink">
                  {iosSafariFreshPromptSteps().map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="font-mono text-xs text-terracotta">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                {copyNotice && (
                  <p className="font-inter text-sm italic text-ink-soft" role="status">
                    {copyNotice}
                  </p>
                )}

                <PrimaryButton
                  type="button"
                  className="w-full"
                  onClick={() => void handleCopyLink()}
                >
                  Copy link →
                </PrimaryButton>

                <PrimaryButton
                  type="button"
                  className="w-full"
                  disabled={disabled || micStatus === "requesting"}
                  onClick={() => void handleEnable()}
                >
                  Try again →
                </PrimaryButton>

                {onUsePhoneRecorder && (
                  <p className="text-center">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={onUsePhoneRecorder}
                      className="font-inter text-sm text-terracotta underline decoration-terracotta/60 underline-offset-2"
                    >
                      {fileCaptureActionLabel()}
                    </button>
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setOverlay(null)}
                  className="w-full font-inter text-sm text-ink-soft underline underline-offset-2"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
