import {
  classifyMicError,
  isIOS,
  type MicErrorInfo,
} from "@/lib/audio/mic-permission";
import { getSupportedAudioMimeType } from "@/lib/audio/mime-type";
import {
  downsamplePeaks,
  MAX_RECORDING_SECONDS,
  readAnalyserLevel,
} from "@/lib/voice-notes/peaks";

export type RecorderResult = {
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
  peaks: number[];
};

export type RecorderLiveUpdate = {
  durationSeconds: number;
  livePeaks: number[];
};

export class WebMediaRecorderAdapter {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private chunks: Blob[] = [];
  private samples: number[] = [];
  private startedAt = 0;
  private rafId: number | null = null;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private stopResolve: ((result: RecorderResult) => void) | null = null;

  constructor(private onLiveUpdate: (update: RecorderLiveUpdate) => void) {}

  private cleanup() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    void this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
  }

  private tickAnalyser() {
    if (!this.analyser) return;
    const level = readAnalyserLevel(this.analyser);
    this.samples.push(level);
    const livePeaks = downsamplePeaks(this.samples.slice(-120), 30);
    const durationSeconds = Math.floor((Date.now() - this.startedAt) / 1000);
    this.onLiveUpdate({ durationSeconds, livePeaks });
    this.rafId = requestAnimationFrame(() => this.tickAnalyser());
  }

  async start(): Promise<void> {
    this.cleanup();
    this.chunks = [];
    this.samples = [];

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    this.stream = stream;

    const audioContext = new AudioContext();
    await audioContext.resume();
    this.audioContext = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    this.analyser = analyser;

    const mimeType = getSupportedAudioMimeType();
    if (typeof MediaRecorder === "undefined") {
      this.cleanup();
      throw new DOMException("MediaRecorder unsupported", "NotSupportedError");
    }

    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    );
    this.mediaRecorder = recorder;
    this.startedAt = Date.now();

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };

    recorder.onstop = () => {
      const recordedMimeType = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(this.chunks, { type: recordedMimeType });
      const durationSeconds = Math.max(
        1,
        Math.round((Date.now() - this.startedAt) / 1000),
      );
      const peaks = downsamplePeaks(this.samples, 30);
      this.cleanup();
      this.stopResolve?.({
        blob,
        mimeType: recordedMimeType,
        durationSeconds,
        peaks,
      });
      this.stopResolve = null;
    };

    recorder.start(200);
    this.onLiveUpdate({
      durationSeconds: 0,
      livePeaks: Array.from({ length: 30 }, () => 0.08),
    });
    this.tickAnalyser();

    this.timerId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startedAt) / 1000);
      if (elapsed >= MAX_RECORDING_SECONDS) {
        void this.stop();
      }
    }, 250);
  }

  stop(): Promise<RecorderResult> {
    const recorder = this.mediaRecorder;
    if (!recorder || recorder.state === "inactive") {
      return Promise.reject(new Error("Not recording"));
    }

    return new Promise((resolve) => {
      this.stopResolve = resolve;
      recorder.stop();
    });
  }

  reset() {
    if (this.mediaRecorder?.state === "recording") {
      this.mediaRecorder.stop();
    }
    this.cleanup();
    this.mediaRecorder = null;
    this.chunks = [];
    this.samples = [];
    this.stopResolve = null;
  }
}

function flatPeaks() {
  return Array.from({ length: 30 }, () => 0.12);
}

async function readAudioDuration(blob: Blob): Promise<number> {
  if (typeof window === "undefined") return 1;

  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    const finish = (seconds: number) => {
      URL.revokeObjectURL(url);
      resolve(Math.max(1, Math.round(seconds)));
    };

    audio.addEventListener("loadedmetadata", () => {
      finish(Number.isFinite(audio.duration) ? audio.duration : 1);
    });
    audio.addEventListener("error", () => finish(1));
  });
}

const IOS_AUDIO_ACCEPT =
  "audio/mp4,audio/x-m4a,audio/m4a,audio/aac,audio/wav,audio/mpeg,audio/*";

function configureAudioFileInput(input: HTMLInputElement) {
  if (isIOS()) {
    input.accept = IOS_AUDIO_ACCEPT;
    return;
  }

  input.accept = "audio/*";
  input.setAttribute("capture", "user");
}

function attachHiddenFileInput(input: HTMLInputElement) {
  input.style.position = "fixed";
  input.style.left = "0";
  input.style.top = "0";
  input.style.width = "1px";
  input.style.height = "1px";
  input.style.opacity = "0";
  document.body.appendChild(input);
}

export async function captureAudioFile(): Promise<RecorderResult> {
  if (typeof document === "undefined") {
    throw new DOMException("File capture unavailable", "NotSupportedError");
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    configureAudioFileInput(input);
    attachHiddenFileInput(input);

    const cleanup = () => {
      input.remove();
    };

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      cleanup();
      if (!file) {
        reject(new DOMException("Capture cancelled", "AbortError"));
        return;
      }

      void (async () => {
        const mimeType = file.type || "audio/mp4";
        const durationSeconds = await readAudioDuration(file);
        resolve({
          blob: file,
          mimeType,
          durationSeconds: Math.min(durationSeconds, MAX_RECORDING_SECONDS),
          peaks: flatPeaks(),
        });
      })();
    });

    input.addEventListener("cancel", () => {
      cleanup();
      reject(new DOMException("Capture cancelled", "AbortError"));
    });

    input.click();
  });
}

/**
 * Map an unknown error from a recorder operation to a MicErrorInfo.
 *
 * Returns the discriminated-union error from classifyMicError, but handles
 * AbortError as a "silent" no-op (empty message) so the UI doesn't show
 * an error when the user simply canceled.
 */
export function mapRecorderError(err: unknown): MicErrorInfo {
  if (err instanceof DOMException && err.name === "AbortError") {
    return {
      kind: "unknown",
      message: "",
      settingsHint: null,
    };
  }

  // classifyMicError returns MicAccessResult ({ ok: false, error: {...} }).
  // Extract the error object for callers that expect MicErrorInfo.
  const result = classifyMicError(err);
  if (!result.ok) {
    return result.error;
  }

  // Defensive fallback — shouldn't happen since classifyMicError always
  // returns { ok: false } for error inputs.
  return {
    kind: "unknown",
    message: "Something went wrong with the microphone.",
    settingsHint: null,
  };
}
