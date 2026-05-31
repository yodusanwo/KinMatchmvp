import { Capacitor } from "@capacitor/core";
import type { CapacitorAudioRecorderPlugin } from "@capgo/capacitor-audio-recorder";
import { downsamplePeaks } from "@/lib/voice-notes/peaks";
import type {
  RecorderLiveUpdate,
  RecorderResult,
} from "@/lib/audio/recorder-adapter";

const NATIVE_START_TIMEOUT_MS = 3000;

async function loadNativeRecorder(): Promise<CapacitorAudioRecorderPlugin> {
  const { CapacitorAudioRecorder } = await import(
    "@capgo/capacitor-audio-recorder"
  );
  return CapacitorAudioRecorder;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Native recorder timed out"));
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function requestNativeMicAccess(): Promise<boolean> {
  const recorder = await loadNativeRecorder();
  const status = await withTimeout(
    recorder.requestPermissions(),
    NATIVE_START_TIMEOUT_MS
  );
  return status.recordAudio === "granted";
}

export class NativeCapacitorRecorderAdapter {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private amplitudeSamples: number[] = [];
  private startedAt = 0;

  constructor(
    private onLiveUpdate: (update: RecorderLiveUpdate) => void
  ) {}

  private clearTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  async start(): Promise<void> {
    this.clearTimer();
    this.amplitudeSamples = [];
    this.startedAt = Date.now();

    const recorder = await loadNativeRecorder();
    const permission = await withTimeout(
      recorder.requestPermissions(),
      NATIVE_START_TIMEOUT_MS
    );

    if (permission.recordAudio !== "granted") {
      throw new DOMException("Microphone permission denied", "NotAllowedError");
    }

    await withTimeout(recorder.startRecording(), NATIVE_START_TIMEOUT_MS);

    this.onLiveUpdate({
      durationSeconds: 0,
      livePeaks: Array.from({ length: 30 }, () => 0.08),
    });

    this.timerId = setInterval(() => {
      void (async () => {
        try {
          const recorder = await loadNativeRecorder();
          const amplitude = await recorder
            .getCurrentAmplitude()
            .catch(() => ({ value: 0.1 }));

          const level =
            typeof amplitude.value === "number" ? amplitude.value : 0.1;
          this.amplitudeSamples.push(level);

          const durationSeconds = Math.max(
            0,
            Math.floor((Date.now() - this.startedAt) / 1000)
          );

          this.onLiveUpdate({
            durationSeconds,
            livePeaks: downsamplePeaks(this.amplitudeSamples.slice(-120), 30),
          });
        } catch {
          // ignore polling errors while recording
        }
      })();
    }, 250);
  }

  async stop(): Promise<RecorderResult> {
    this.clearTimer();
    const recorder = await loadNativeRecorder();
    const result = await recorder.stopRecording();
    const durationSeconds = Math.max(
      1,
      Math.round(
        (result.duration ?? Date.now() - this.startedAt) / 1000
      )
    );
    const peaks = downsamplePeaks(this.amplitudeSamples, 30);

    if (result.blob) {
      return {
        blob: result.blob,
        mimeType: result.blob.type || "audio/mp4",
        durationSeconds,
        peaks,
      };
    }

    if (!result.uri) {
      throw new Error("Native recorder returned no audio");
    }

    const webPath = Capacitor.convertFileSrc(result.uri);
    const response = await fetch(webPath);
    const blob = await response.blob();
    const mimeType = blob.type || "audio/mp4";

    return {
      blob,
      mimeType,
      durationSeconds,
      peaks,
    };
  }

  reset() {
    this.clearTimer();
    this.amplitudeSamples = [];
    void loadNativeRecorder()
      .then((recorder) => recorder.cancelRecording())
      .catch(() => undefined);
  }
}
