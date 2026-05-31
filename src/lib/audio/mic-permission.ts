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

export function isSecureRecordingContext(): boolean {
  return typeof window !== "undefined" && window.isSecureContext;
}

export function hasGetUserMedia(): boolean {
  return (
    isSecureRecordingContext() &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

export function insecureRecordingHint(): string {
  return "Open kin-matchmvp.vercel.app on your phone, or pick a recording below.";
}

export type MicPermissionState = "granted" | "denied" | "prompt" | "unknown";

export function iosSafariMicUnlockSteps(): string[] {
  return [
    "Tap the aA button left of the address bar.",
    "Tap Website Settings.",
    "Set Microphone to Allow.",
    "Reload this page, then tap Try again.",
  ];
}

export function fileCaptureHelperText(): string | null {
  if (isIOS() && !isNativeApp()) {
    return "Safari can't record audio here. Record in Voice Memos first, then tap above and choose Choose File → Browse → Voice Memos.";
  }
  return null;
}

export async function queryMicPermissionState(): Promise<MicPermissionState> {
  if (
    typeof navigator === "undefined" ||
    !isSecureRecordingContext() ||
    !navigator.permissions?.query
  ) {
    return "unknown";
  }

  try {
    const result = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    if (
      result.state === "granted" ||
      result.state === "denied" ||
      result.state === "prompt"
    ) {
      return result.state;
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

export async function probeMicPermission(): Promise<MicAccessResult | null> {
  if (isNativeApp()) return null;

  const permissionState = await queryMicPermissionState();

  if (permissionState === "granted") {
    return { ok: true };
  }

  // Don't pre-emptively block on "denied" — let the user tap Enable so we can
  // show the in-app guidance overlay and call getUserMedia from that gesture.
  return null;
}

export function iosSafariFreshPromptSteps(): string[] {
  return [
    "Tap Safari's tabs icon at the bottom right.",
    "Tap Private, then open KinMatch and sign in again.",
    "Come back here — Safari will ask for your microphone. Tap Allow.",
  ];
}

export function shouldPrimeMicPrompt(): boolean {
  return isIOS() && !isNativeApp() && isSecureRecordingContext();
}

export function fileCaptureActionLabel(): string {
  return isIOS() ? "Import from Voice Memos →" : "Use your phone's recorder →";
}

export function micSettingsHint(): string | null {
  if (typeof navigator === "undefined") return null;
  if (isNativeApp()) {
    return nativeMicSettingsHint();
  }
  if (isIOS()) {
    return "Tap aA in the address bar → Website Settings → Microphone → Allow, then reload.";
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
            ? "Safari isn't allowed to use your mic yet."
            : "Your browser blocked the microphone.",
        settingsHint: isIOS() && !isNativeApp() ? null : hint,
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
        settingsHint: isSecureRecordingContext()
          ? null
          : insecureRecordingHint(),
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

  if (!isSecureRecordingContext()) {
    return {
      ok: false,
      error: {
        kind: "security",
        message: "Microphone access needs a secure connection.",
        settingsHint: insecureRecordingHint(),
      },
    };
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
