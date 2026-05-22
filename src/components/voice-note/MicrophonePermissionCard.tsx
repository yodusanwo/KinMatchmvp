"use client";

import { PrimaryButton, Subhead } from "@/components/brand";
import { openAppSettings } from "@/lib/audio/platform";
import type { RecorderErrorCode } from "@/lib/audio/types";

type MicrophonePermissionCardProps = {
  errorCode: RecorderErrorCode | null;
  message: string | null;
  isNative: boolean;
  permissionState: "unknown" | "granted" | "denied" | "prompt" | "unsupported";
  onRequestPermission: () => void | Promise<unknown>;
  onRetryRecording: () => void | Promise<unknown>;
  disabled?: boolean;
};

export function MicrophonePermissionCard({
  errorCode,
  message,
  isNative,
  permissionState,
  onRequestPermission,
  onRetryRecording,
  disabled = false,
}: MicrophonePermissionCardProps) {
  if (!message && errorCode !== "permission_denied" && errorCode !== "permission_blocked") {
    return null;
  }

  const showSettings =
    isNative ||
    permissionState === "denied" ||
    errorCode === "permission_blocked";

  return (
    <div className="mt-4 max-w-[320px] space-y-4 text-center">
      <div className="space-y-2">
        <p className="font-sans text-sm font-medium text-ink">
          Turn on the microphone.
        </p>
        <Subhead className="text-center">
          KinMatch only records when you tap the button.
        </Subhead>
        {message && (
          <p
            className="font-inter text-sm italic text-terracotta-deep"
            role="alert"
          >
            {message}
          </p>
        )}
        {!isNative && permissionState === "denied" && (
          <p className="font-inter text-xs italic leading-relaxed text-ink-soft">
            In Safari, open the aA menu → Website Settings → Microphone → Allow.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <PrimaryButton
          type="button"
          disabled={disabled}
          onClick={() => void onRequestPermission()}
        >
          Allow microphone
        </PrimaryButton>

        <PrimaryButton
          type="button"
          disabled={disabled}
          onClick={() => void onRetryRecording()}
        >
          Try recording again
        </PrimaryButton>

        {showSettings && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void openAppSettings()}
            className="font-inter text-sm text-terracotta underline decoration-terracotta/60 underline-offset-2 disabled:text-ink-soft"
          >
            Open settings
          </button>
        )}
      </div>
    </div>
  );
}
