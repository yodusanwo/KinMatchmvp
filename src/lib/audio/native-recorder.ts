import { requestNativeMicrophonePermission } from "@/lib/audio/permissions";
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

function mapPermission(
  value: string | undefined
): MicrophonePermissionState {
  if (value === "granted") return "granted";
  if (value === "denied") return "denied";
  return "prompt";
}

function permissionError(state: MicrophonePermissionState): RecorderError {
  if (state === "denied") {
    return {
      code: "permission_blocked",
      message: "Microphone access is blocked",
    };
  }
  return {
    code: "permission_denied",
    message: "Microphone permission is required",
  };
}

export class NativeAudioRecorder implements AudioRecorderAdapter {
  private samples: number[] = [];
  private amplitudeTimer: ReturnType<typeof setInterval> | null = null;
  private maxTimer: ReturnType<typeof setTimeout> | null = null;
  private stopPromise: Promise<RecorderResult> | null = null;

  private async getPlugin() {
    const { CapacitorAudioRecorder } = await import(
      "@capgo/capacitor-audio-recorder"
    );
    return CapacitorAudioRecorder;
  }

  async requestPermission(): Promise<MicrophonePermissionState> {
    return requestNativeMicrophonePermission();
  }

  async startRecording(): Promise<void> {
    const AudioRecorder = await this.getPlugin();
    const permission = await this.requestPermission();
    if (permission === "unsupported") {
      throw {
        code: "unsupported",
        message: "Native recording unavailable",
      } satisfies RecorderError;
    }
    if (permission !== "granted") {
      throw permissionError(permission);
    }

    this.samples = [];
    try {
      await AudioRecorder.startRecording({
        sampleRate: 44100,
        bitRate: 128000,
      });
    } catch {
      throw {
        code: "unknown",
        message: "Could not start native recording",
      } satisfies RecorderError;
    }

    this.amplitudeTimer = setInterval(() => {
      const level = 0.08 + Math.random() * 0.35;
      this.samples.push(Math.min(1, Math.max(0.06, level)));
    }, 120);

    this.maxTimer = setTimeout(() => {
      void this.stopRecording();
    }, MAX_RECORDING_SECONDS * 1000);
  }

  stopRecording(): Promise<RecorderResult> {
    if (this.stopPromise) return this.stopPromise;

    this.stopPromise = this.finishRecording();
    return this.stopPromise;
  }

  private async finishRecording(): Promise<RecorderResult> {
    if (this.amplitudeTimer) {
      clearInterval(this.amplitudeTimer);
      this.amplitudeTimer = null;
    }
    if (this.maxTimer) {
      clearTimeout(this.maxTimer);
      this.maxTimer = null;
    }

    try {
      const AudioRecorder = await this.getPlugin();
      const result = await AudioRecorder.stopRecording();

      if (result.blob) {
        const durationSeconds = Math.max(
          1,
          Math.min(
            MAX_RECORDING_SECONDS,
            Math.round((result.duration ?? 1000) / 1000)
          )
        );
        const mimeType = result.blob.type || "audio/mp4";
        const peaks = downsamplePeaks(this.samples, 30);
        this.stopPromise = null;
        return {
          blob: result.blob,
          mimeType,
          durationSeconds,
          peaks,
        };
      }

      if (!result.uri) {
        throw new Error("No recording URI returned");
      }

      const { Capacitor } = await import("@capacitor/core");
      const fileUrl = Capacitor.convertFileSrc(result.uri);
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error("Could not read recorded audio");
      }

      const blob = await response.blob();
      const mimeType = blob.type || "audio/mp4";
      const durationSeconds = Math.max(
        1,
        Math.min(
          MAX_RECORDING_SECONDS,
          Math.round((result.duration ?? 1000) / 1000)
        )
      );
      const peaks = downsamplePeaks(this.samples, 30);

      this.stopPromise = null;
      return { blob, mimeType, durationSeconds, peaks };
    } catch (err) {
      this.stopPromise = null;
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        typeof (err as RecorderError).code === "string"
      ) {
        throw err;
      }
      throw {
        code: "unknown",
        message: "Could not finish recording",
      } satisfies RecorderError;
    }
  }

  async cancelRecording(): Promise<void> {
    if (this.amplitudeTimer) {
      clearInterval(this.amplitudeTimer);
      this.amplitudeTimer = null;
    }
    if (this.maxTimer) {
      clearTimeout(this.maxTimer);
      this.maxTimer = null;
    }
    this.stopPromise = null;
    try {
      const AudioRecorder = await this.getPlugin();
      await AudioRecorder.cancelRecording();
    } catch {
      // ignore
    }
  }

}
