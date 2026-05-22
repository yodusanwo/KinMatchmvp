import { getSupportedAudioMimeType } from "@/lib/audio/mime-type";
import type {
  AudioRecorderAdapter,
  MicrophonePermissionState,
  RecorderError,
  RecorderResult,
} from "@/lib/audio/types";
import {
  downsamplePeaks,
  MAX_RECORDING_SECONDS,
  readAnalyserLevel,
} from "@/lib/voice-notes/peaks";

function permissionError(err: unknown): RecorderError {
  const name =
    err && typeof err === "object" && "name" in err
      ? String((err as { name: string }).name)
      : "";

  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return {
      code: "permission_denied",
      message: "Microphone permission denied",
    };
  }

  return {
    code: "unknown",
    message: "Could not access microphone",
  };
}

export class WebAudioRecorder implements AudioRecorderAdapter {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private chunks: Blob[] = [];
  private samples: number[] = [];
  private startedAt = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private maxTimer: ReturnType<typeof setTimeout> | null = null;
  private stopResolve: ((result: RecorderResult) => void) | null = null;
  private stopReject: ((error: RecorderError) => void) | null = null;

  async requestPermission(): Promise<MicrophonePermissionState> {
    if (!navigator.mediaDevices?.getUserMedia) {
      return "unsupported";
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return "granted";
    } catch (err) {
      const error = permissionError(err);
      if (error.code === "permission_denied") return "denied";
      return "unsupported";
    }
  }

  async startRecording(): Promise<void> {
    this.cleanup();

    try {
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
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      this.mediaRecorder = recorder;
      this.chunks = [];
      this.samples = [];
      this.startedAt = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.chunks.push(event.data);
      };

      recorder.onstop = () => {
        const recordedMimeType =
          recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(this.chunks, { type: recordedMimeType });
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - this.startedAt) / 1000)
        );
        const peaks = downsamplePeaks(this.samples, 30);
        this.cleanup();
        this.stopResolve?.({
          blob,
          mimeType: recordedMimeType,
          durationSeconds,
          peaks,
        });
      };

      recorder.onerror = () => {
        this.cleanup();
        this.stopReject?.({
          code: "unknown",
          message: "Recording failed",
        });
      };

      recorder.start(200);
      this.timer = setInterval(() => {
        if (this.analyser) {
          this.samples.push(readAnalyserLevel(this.analyser));
        }
      }, 100);

      this.maxTimer = setTimeout(() => {
        void this.stopRecording();
      }, MAX_RECORDING_SECONDS * 1000);
    } catch (err) {
      this.cleanup();
      throw permissionError(err);
    }
  }

  stopRecording(): Promise<RecorderResult> {
    const recorder = this.mediaRecorder;
    if (!recorder || recorder.state === "inactive") {
      return Promise.reject({
        code: "unknown",
        message: "Not recording",
      } satisfies RecorderError);
    }

    return new Promise((resolve, reject) => {
      this.stopResolve = resolve;
      this.stopReject = reject;
      recorder.stop();
    });
  }

  async getCurrentAmplitude(): Promise<number> {
    if (!this.analyser) return 0.08;
    return readAnalyserLevel(this.analyser);
  }

  async cancelRecording(): Promise<void> {
    const recorder = this.mediaRecorder;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.maxTimer) {
      clearTimeout(this.maxTimer);
      this.maxTimer = null;
    }
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    void this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
    this.mediaRecorder = null;
    this.chunks = [];
    this.samples = [];
    this.stopResolve = null;
    this.stopReject = null;
  }
}
