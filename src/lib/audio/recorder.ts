import { isNativePlatform } from "@/lib/audio/platform";
import { NativeAudioRecorder } from "@/lib/audio/native-recorder";
import { WebAudioRecorder } from "@/lib/audio/web-recorder";
import type {
  AudioRecorderAdapter,
  MicrophonePermissionState,
  RecorderError,
  RecorderResult,
} from "@/lib/audio/types";
import {
  downsamplePeaks,
  MAX_RECORDING_SECONDS,
} from "@/lib/voice-notes/peaks";

let adapter: AudioRecorderAdapter | null = null;
let adapterKind: "native" | "web" | null = null;

export function getAudioRecorder(): AudioRecorderAdapter {
  const kind = isNativePlatform() ? "native" : "web";
  if (!adapter || adapterKind !== kind) {
    adapter =
      kind === "native" ? new NativeAudioRecorder() : new WebAudioRecorder();
    adapterKind = kind;
  }
  return adapter;
}

export function resetAudioRecorder() {
  adapter = null;
  adapterKind = null;
}

export async function requestMicrophonePermission(): Promise<MicrophonePermissionState> {
  return getAudioRecorder().requestPermission();
}

export { MAX_RECORDING_SECONDS };

export function resultFromAudioFile(file: File): RecorderResult {
  const mimeType = file.type || "audio/mp4";
  return {
    blob: file,
    mimeType,
    durationSeconds: 1,
    peaks: downsamplePeaks([], 30),
  };
}

export function isRecorderError(value: unknown): value is RecorderError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof (value as RecorderError).code === "string"
  );
}

export async function getDurationFromBlob(blob: Blob): Promise<number> {
  if (typeof window === "undefined") return 1;

  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    const finish = (seconds: number) => {
      URL.revokeObjectURL(url);
      resolve(Math.max(1, Math.min(MAX_RECORDING_SECONDS, seconds)));
    };

    audio.addEventListener("loadedmetadata", () => {
      const duration = Number.isFinite(audio.duration)
        ? Math.round(audio.duration)
        : 1;
      finish(duration);
    });
    audio.addEventListener("error", () => finish(1));
  });
}

export async function enrichResultFromFile(
  file: File
): Promise<RecorderResult> {
  const base = resultFromAudioFile(file);
  const durationSeconds = await getDurationFromBlob(base.blob);
  return { ...base, durationSeconds };
}

export type {
  RecorderResult,
  RecorderError,
  RecorderErrorCode,
  MicrophonePermissionState,
} from "@/lib/audio/types";
