/**
 * Microphone permission handling for KinMatch.
 *
 * IMPORTANT ARCHITECTURE NOTE:
 * This file separates two concerns:
 *
 * 1. checkMicPermissionState(), Safe to call anywhere (including useEffect).
 *    Uses navigator.permissions.query() only, NEVER triggers a permission prompt.
 *
 * 2. requestMicAccess(), MUST only be called synchronously inside an onClick handler.
 *    Calls getUserMedia(). On iOS Safari, calling this from useEffect or after
 *    awaits will silently fail and permanently deny permission for the site.
 *
 * The cardinal rule: never call requestMicAccess() outside a direct user tap.
 */

import {
  isNativeApp,
  nativeMicSettingsHint,
} from "@/lib/audio/native-platform";
import { requestNativeMicAccess } from "@/lib/audio/native-recorder";

// ============================================================
// Types
// ============================================================

export type MicPermissionState = "granted" | "denied" | "prompt" | "unknown";

export type MicErrorKind =
  | "denied"
  | "no_device"
  | "unsupported"
  | "insecure"
  | "unknown";

export type MicAccessError = {
  kind: MicErrorKind;
  message: string;
  settingsHint: string | null;
};

export type MicAccessResult =
  | { ok: true; stream: MediaStream }
  | { ok: false; error: MicAccessError };

// Backwards-compatible alias for files that still import MicErrorInfo
export type MicErrorInfo = MicAccessError;

// ============================================================
// Environment checks (all safe to call anywhere)
// ============================================================

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isDesktop(): boolean {
  if (typeof navigator === "undefined") return false;
  return !/Mobi|Android/i.test(navigator.userAgent);
}

export function isSecureRecordingContext(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

export function isMediaRecorderSupported(): boolean {
  return typeof MediaRecorder !== "undefined";
}

export function hasGetUserMedia(): boolean {
  return Boolean(
    typeof navigator !== "undefined" &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function",
  );
}

// ============================================================
// Permission state queries (safe to call anywhere)
// ============================================================

/**
 * Check the current microphone permission state WITHOUT triggering a prompt.
 *
 * Safe to call from useEffect, app load, anywhere. Uses navigator.permissions.query()
 * which is a non-triggering check.
 *
 * Returns 'unknown' on iOS Safari (which doesn't support permissions API for microphone)
 * or when the Permissions API isn't available. The caller should treat 'unknown' as
 * "we don't know, show the setup intro and let the user opt in."
 */
export async function checkMicPermissionState(): Promise<MicPermissionState> {
  if (typeof navigator === "undefined") {
    console.log(
      "[mic-permission] checkMicPermissionState: no navigator, returning unknown",
    );
    return "unknown";
  }

  if (isNativeApp()) {
    console.log(
      "[mic-permission] checkMicPermissionState: native app, returning unknown",
    );
    return "unknown";
  }

  if (!isSecureRecordingContext()) {
    console.log(
      "[mic-permission] checkMicPermissionState: insecure context, returning denied",
    );
    return "denied";
  }

  if (
    !navigator.permissions ||
    typeof navigator.permissions.query !== "function"
  ) {
    console.log(
      "[mic-permission] checkMicPermissionState: permissions API not available, returning unknown",
    );
    return "unknown";
  }

  try {
    const result = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    console.log(
      "[mic-permission] checkMicPermissionState: query returned",
      result.state,
    );
    return result.state as MicPermissionState;
  } catch (err) {
    console.log(
      "[mic-permission] checkMicPermissionState: query threw, returning unknown",
      err,
    );
    return "unknown";
  }
}

// ============================================================
// Permission request (MUST be called from a tap handler only)
// ============================================================

/**
 * Request microphone access by calling getUserMedia.
 *
 * WARNING: This function MUST only be called synchronously inside an onClick handler.
 *
 * Do NOT call it:
 * - From useEffect or component mount
 * - After an await of any other operation
 * - Inside setTimeout, setInterval, or Promise chains
 * - From any code path that isn't a direct response to a user tap
 *
 * iOS Safari is strict: if it doesn't recognize this call as a synchronous response
 * to a user gesture, it silently denies permission AND blocks future requests
 * until the user manually clears site data or changes Settings.
 */
export async function requestMicAccess(): Promise<MicAccessResult> {
  console.log("[mic-permission] requestMicAccess: called");

  if (isNativeApp()) {
    try {
      const granted = await requestNativeMicAccess();
      console.log(
        "[mic-permission] requestMicAccess: native granted =",
        granted,
      );
      if (granted) {
        return { ok: true, stream: new MediaStream() };
      }
      return {
        ok: false,
        error: {
          kind: "denied",
          message: "KinMatch needs microphone access.",
          settingsHint: nativeMicSettingsHint(),
        },
      };
    } catch (err) {
      console.log("[mic-permission] requestMicAccess: native threw", err);
      return classifyMicError(err);
    }
  }

  if (!isSecureRecordingContext()) {
    console.log("[mic-permission] requestMicAccess: insecure context");
    return {
      ok: false,
      error: {
        kind: "insecure",
        message: "Voice notes need a secure connection.",
        settingsHint: insecureRecordingHint(),
      },
    };
  }

  if (!hasGetUserMedia()) {
    console.log(
      "[mic-permission] requestMicAccess: getUserMedia not available",
    );
    return {
      ok: false,
      error: {
        kind: "unsupported",
        message: "This browser can't record voice notes.",
        settingsHint: null,
      },
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("[mic-permission] requestMicAccess: getUserMedia succeeded");
    return { ok: true, stream };
  } catch (err) {
    console.log(
      "[mic-permission] requestMicAccess: getUserMedia rejected",
      err,
    );
    return classifyMicError(err);
  }
}

// ============================================================
// Error classification
// ============================================================

export function classifyMicError(err: unknown): MicAccessResult {
  if (!(err instanceof Error)) {
    return {
      ok: false,
      error: {
        kind: "unknown",
        message: "Something went wrong with the microphone.",
        settingsHint: null,
      },
    };
  }

  const hint = micSettingsHint();

  switch (err.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return {
        ok: false,
        error: {
          kind: "denied",
          message: isIOS()
            ? "Safari blocked the microphone."
            : "Your browser blocked the microphone.",
          settingsHint: hint,
        },
      };

    case "NotFoundError":
    case "DevicesNotFoundError":
      return {
        ok: false,
        error: {
          kind: "no_device",
          message: "No microphone was found on this device.",
          settingsHint: null,
        },
      };

    case "NotSupportedError":
    case "TypeError":
      return {
        ok: false,
        error: {
          kind: "unsupported",
          message: "This browser can't record voice notes here.",
          settingsHint: null,
        },
      };

    case "SecurityError":
      return {
        ok: false,
        error: {
          kind: "insecure",
          message:
            "The browser blocked the microphone for security reasons. Try opening this link in Chrome.",
          settingsHint: null,
        },
      };

    case "NotReadableError":
    case "TrackStartError":
      return {
        ok: false,
        error: {
          kind: "no_device",
          message:
            "The microphone is in use by another app. Close other apps and try again.",
          settingsHint: null,
        },
      };

    default:
      return {
        ok: false,
        error: {
          kind: "unknown",
          message: "Couldn't access the microphone.",
          settingsHint: hint,
        },
      };
  }
}

// ============================================================
// Recovery instructions
// ============================================================

/**
 * Single recovery path for iOS Safari users whose mic was blocked.
 */
export function iosSafariUnlockSteps(): string[] {
  return [
    'Tap the "aA" button on the left side of the address bar.',
    'Tap "Website Settings".',
    'Set Microphone to "Allow".',
    'Close this dialog and tap "Try again".',
  ];
}

// ============================================================
// Hints
// ============================================================

export function micSettingsHint(): string | null {
  if (typeof navigator === "undefined") return null;

  if (isNativeApp()) {
    return nativeMicSettingsHint();
  }

  if (isIOS()) {
    return null;
  }

  return "Allow microphone access in your browser settings, then reload this page.";
}

export function insecureRecordingHint(): string {
  return "Open kin-matchmvp.vercel.app on your phone over HTTPS to record voice notes.";
}

// ============================================================
// UI hint mapping
// ============================================================

export function permissionStateToUiHint(
  state: MicPermissionState,
): "idle" | "ready" | "blocked" | "unknown" {
  switch (state) {
    case "granted":
      return "ready";
    case "denied":
      return "blocked";
    case "prompt":
      return "idle";
    case "unknown":
    default:
      return "unknown";
  }
}
