import { isIosSimulator, isNativePlatform } from "@/lib/audio/platform";
import type { MicrophonePermissionState } from "@/lib/audio/types";

/** iOS can leave `requestPermissions()` pending if the system alert never appears. */
export const MICROPHONE_REQUEST_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), ms);
    }),
  ]);
}

/** Native shell only — calls the plugin directly with a timeout so UI cannot hang. */
export async function requestNativeMicrophonePermission(): Promise<MicrophonePermissionState> {
  try {
    const { CapacitorAudioRecorder } = await import(
      "@capgo/capacitor-audio-recorder"
    );

    const current = await CapacitorAudioRecorder.checkPermissions();
    if (current.recordAudio === "granted") return "granted";
    if (current.recordAudio === "denied") return "denied";

    const requested = await withTimeout(
      CapacitorAudioRecorder.requestPermissions(),
      MICROPHONE_REQUEST_TIMEOUT_MS
    );

    if (requested?.recordAudio === "granted") return "granted";
    if (requested?.recordAudio === "denied") return "denied";

    const after = await CapacitorAudioRecorder.checkPermissions();
    if (after.recordAudio === "granted") return "granted";
    if (after.recordAudio === "denied") return "denied";

    return "denied";
  } catch {
    return "unsupported";
  }
}

export function nativeMicBlockedMessage(): string {
  const base =
    "The microphone prompt didn't come through. Look for an Allow alert — it can sit behind the simulator window.";
  if (isIosSimulator()) {
    return `${base} Or open Settings → KinMatch → Microphone, and in Simulator use Features → Microphone.`;
  }
  return `${base} Or open Settings → KinMatch → Microphone.`;
}

export async function queryMicrophonePermission(): Promise<MicrophonePermissionState> {
  if (isNativePlatform()) {
    try {
      const { CapacitorAudioRecorder } = await import(
        "@capgo/capacitor-audio-recorder"
      );
      const status = await CapacitorAudioRecorder.checkPermissions();
      if (status.recordAudio === "granted") return "granted";
      if (status.recordAudio === "denied") return "denied";
      return "prompt";
    } catch {
      return "unsupported";
    }
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return "unsupported";
  }

  try {
    const permissions = navigator.permissions;
    if (!permissions?.query) return "prompt";

    const result = await permissions.query({
      name: "microphone" as PermissionName,
    });

    if (result.state === "granted") return "granted";
    if (result.state === "denied") return "denied";
    return "prompt";
  } catch {
    return "prompt";
  }
}

export function recorderErrorMessage(error: {
  code: string;
  message: string;
}): string {
  switch (error.code) {
    case "permission_denied":
      return "Turn on the microphone to record a voice note.";
    case "permission_blocked":
      return "Microphone access is blocked. Open settings to allow it, then try again.";
    case "unsupported":
      return "Voice recording isn't supported in this browser.";
    default:
      return error.message || "Could not start recording.";
  }
}
