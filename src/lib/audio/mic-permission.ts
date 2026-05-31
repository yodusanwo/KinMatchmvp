import { isNativeApp, nativeMicSettingsHint } from "@/lib/audio/native-platform";
import { requestNativeMicAccess } from "@/lib/audio/native-recorder";

export type MicErrorKind =
  | "denied"
  | "not_found"
  | "unsupported"
  | "security"
  | "unknown";

export type MicErrorInfo = {
  kind: MicErrorKind;
  message: string;
  settingsHint: string | null;
};

export type MicAccessResult =
  | { ok: true }
  | { ok: false; error: MicErrorInfo };

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isMediaRecorderSupported(): boolean {
  return typeof MediaRecorder !== "undefined";
}

export function hasGetUserMedia(): boolean {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

export function micSettingsHint(): string | null {
  if (typeof navigator === "undefined") return null;
  if (isNativeApp()) {
    return nativeMicSettingsHint();
  }
  if (isIOS()) {
    return "Settings → Safari → Microphone → Allow for this site, then reload.";
  }
  return "Allow microphone access in your browser settings, then reload.";
}

export function classifyMicError(err: unknown): MicErrorInfo {
  const name = err instanceof DOMException ? err.name : "";
  const hint = micSettingsHint();

  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return {
        kind: "denied",
        message: isNativeApp()
          ? "KinMatch needs microphone access."
          : isIOS()
            ? "Safari blocked the microphone."
            : "Your browser blocked the microphone.",
        settingsHint: hint,
      };
    case "NotFoundError":
    case "DevicesNotFoundError":
      return {
        kind: "not_found",
        message: "No microphone found on this device.",
        settingsHint: null,
      };
    case "NotSupportedError":
      return {
        kind: "unsupported",
        message: isNativeApp()
          ? "Native recording isn't available — try again or use your phone's recorder."
          : "This browser can't record here — use your phone's recorder instead.",
        settingsHint: null,
      };
    case "SecurityError":
      return {
        kind: "security",
        message: "Microphone access needs a secure connection.",
        settingsHint: null,
      };
    default:
      return {
        kind: "unknown",
        message: "Couldn't start recording — try again.",
        settingsHint: hint,
      };
  }
}

export async function requestMicAccess(): Promise<MicAccessResult> {
  if (isNativeApp()) {
    try {
      const granted = await requestNativeMicAccess();
      if (granted) return { ok: true };
      return {
        ok: false,
        error: {
          kind: "denied",
          message: "KinMatch needs microphone access.",
          settingsHint: nativeMicSettingsHint(),
        },
      };
    } catch (err) {
      return { ok: false, error: classifyMicError(err) };
    }
  }

  if (!hasGetUserMedia()) {
    return {
      ok: false,
      error: {
        kind: "unsupported",
        message: "This browser can't set up voice notes here.",
        settingsHint: null,
      },
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return { ok: true };
  } catch (err) {
    return { ok: false, error: classifyMicError(err) };
  }
}

export function formatMicError(error: MicErrorInfo): string {
  return error.settingsHint
    ? `${error.message} ${error.settingsHint}`
    : error.message;
}
