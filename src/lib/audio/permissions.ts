import { isNativePlatform } from "@/lib/audio/platform";
import type { MicrophonePermissionState } from "@/lib/audio/types";

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
