"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { canRecordInBrowser } from "@/lib/audio/mime-type";
import {
  checkMicPermissionState,
  hasGetUserMedia,
  requestMicAccess as requestMicAccessCore,
  type MicAccessError,
} from "@/lib/audio/mic-permission";
import { isNativeApp } from "@/lib/audio/native-platform";
import { NativeCapacitorRecorderAdapter } from "@/lib/audio/native-recorder";
import {
  captureAudioFile,
  mapRecorderError,
  WebMediaRecorderAdapter,
  type RecorderLiveUpdate,
  type RecorderResult,
} from "@/lib/audio/recorder-adapter";
import { MAX_RECORDING_SECONDS } from "@/lib/voice-notes/peaks";

export type MicStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "blocked"
  | "unsupported";

// Backwards-compatible alias so existing imports of MicErrorInfo keep working
export type MicErrorInfo = MicAccessError;

export type VoiceRecorderState = {
  isRecording: boolean;
  durationSeconds: number;
  livePeaks: number[];
  audioBlob: Blob | null;
  recordedMimeType: string;
  peaks: number[];
  error: string | null;
  micStatus: MicStatus;
  micError: MicAccessError | null;
  usedFileCapture: boolean;
  canUseWebRecorder: boolean;
  isNativeApp: boolean;
};

type RecordingAdapter = {
  start(): Promise<void>;
  stop(): Promise<RecorderResult>;
  reset(): void;
};

/**
 * Map a MicAccessError to a user-facing string for display.
 * The error.message is already user-friendly (set in classifyMicError),
 * so we mostly just return it directly.
 */
function formatMicErrorForDisplay(error: MicAccessError): string {
  return error.message;
}

export function useVoiceRecorder() {
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    durationSeconds: 0,
    livePeaks: Array.from({ length: 30 }, () => 0.08),
    audioBlob: null,
    recordedMimeType: "",
    peaks: [],
    error: null,
    micStatus: "idle",
    micError: null,
    usedFileCapture: false,
    canUseWebRecorder: false,
    isNativeApp: false,
  });

  const adapterRef = useRef<RecordingAdapter | null>(null);
  const onLiveUpdateRef = useRef<(update: RecorderLiveUpdate) => void>(
    () => undefined,
  );

  onLiveUpdateRef.current = (update: RecorderLiveUpdate) => {
    setState((current) => ({
      ...current,
      durationSeconds: update.durationSeconds,
      livePeaks: update.livePeaks,
    }));
  };

  // On mount: detect environment and check permission state WITHOUT triggering a prompt.
  // This is safe to call here because checkMicPermissionState only uses
  // navigator.permissions.query() and never calls getUserMedia.
  useEffect(() => {
    const native = isNativeApp();
    setState((current) => ({
      ...current,
      isNativeApp: native,
      canUseWebRecorder: native || (hasGetUserMedia() && canRecordInBrowser()),
    }));

    if (native) return;

    void (async () => {
      const permissionState = await checkMicPermissionState();
      console.log(
        "[useVoiceRecorder] mount: permission state =",
        permissionState,
      );

      if (permissionState === "granted") {
        setState((current) => ({
          ...current,
          micStatus: "ready",
          micError: null,
          error: null,
        }));
        return;
      }

      if (permissionState === "denied") {
        setState((current) => ({
          ...current,
          micStatus: "blocked",
          micError: null,
          error: null,
        }));
        return;
      }

      // 'prompt' or 'unknown' (iOS Safari case): stay in 'idle' until
      // the user explicitly taps to set up the microphone.
      // Do NOT call getUserMedia here — that would silently fail on iOS Safari.
      setState((current) => ({
        ...current,
        micStatus: "idle",
        micError: null,
        error: null,
      }));
    })();
  }, []);

  useEffect(() => {
    return () => {
      adapterRef.current?.reset();
    };
  }, []);

  useEffect(() => {
    if (!state.isRecording) return;
    if (state.durationSeconds >= MAX_RECORDING_SECONDS) {
      void stopRecordingRef.current();
    }
  }, [state.isRecording, state.durationSeconds]);

  const stopRecordingRef = useRef<() => Promise<void>>(async () => undefined);

  const applyRecordingResult = useCallback(
    (result: RecorderResult, usedFileCapture: boolean) => {
      setState((current) => ({
        ...current,
        isRecording: false,
        durationSeconds: result.durationSeconds,
        audioBlob: result.blob,
        recordedMimeType: result.mimeType,
        peaks: result.peaks,
        livePeaks: result.peaks,
        error: null,
        usedFileCapture,
      }));
    },
    [],
  );

  /**
   * Request microphone access. Must be called from a user tap handler.
   *
   * The underlying requestMicAccessCore() calls getUserMedia synchronously,
   * so as long as this function is invoked from an onClick handler
   * (with no awaits before the call), iOS Safari will show the native prompt.
   */
  const requestMicAccess = useCallback(async (): Promise<boolean> => {
    console.log("[useVoiceRecorder] requestMicAccess: tapped");

    setState((current) => ({
      ...current,
      micStatus: "requesting",
      micError: null,
      error: null,
    }));

    const result = await requestMicAccessCore();

    if (result.ok) {
      console.log("[useVoiceRecorder] requestMicAccess: granted");
      // Stop the stream — we just wanted the permission grant.
      // The actual recording stream is created later in startRecording.
      result.stream.getTracks().forEach((track) => track.stop());

      setState((current) => ({
        ...current,
        micStatus: "ready",
        micError: null,
        error: null,
        canUseWebRecorder:
          isNativeApp() || (hasGetUserMedia() && canRecordInBrowser()),
      }));
      return true;
    }

    console.log("[useVoiceRecorder] requestMicAccess: failed", result.error);
    const micStatus =
      result.error.kind === "unsupported" ? "unsupported" : "blocked";

    setState((current) => ({
      ...current,
      micStatus,
      micError: result.error,
      error: formatMicErrorForDisplay(result.error),
    }));
    return false;
  }, []);

  const createWebAdapter = useCallback(() => {
    return new WebMediaRecorderAdapter((update) => {
      onLiveUpdateRef.current(update);
    });
  }, []);

  const createNativeAdapter = useCallback(() => {
    return new NativeCapacitorRecorderAdapter((update) => {
      onLiveUpdateRef.current(update);
    });
  }, []);

  const startRecording = useCallback(async () => {
    setState((current) => ({
      ...current,
      error: null,
      audioBlob: null,
      recordedMimeType: "",
      peaks: [],
      usedFileCapture: false,
    }));

    const beginRecording = async (adapter: RecordingAdapter) => {
      await adapter.start();
      setState((current) => ({
        ...current,
        isRecording: true,
        durationSeconds: 0,
        livePeaks: Array.from({ length: 30 }, () => 0.08),
        micStatus: "ready",
        error: null,
      }));
    };

    if (isNativeApp()) {
      try {
        adapterRef.current?.reset();
        adapterRef.current = createNativeAdapter();
        await beginRecording(adapterRef.current);
        return;
      } catch (err) {
        adapterRef.current?.reset();
        adapterRef.current = null;
        console.warn("Native recorder failed, falling back to web", err);
      }
    }

    try {
      adapterRef.current?.reset();
      adapterRef.current = createWebAdapter();
      await beginRecording(adapterRef.current);
    } catch (err) {
      adapterRef.current?.reset();
      adapterRef.current = null;
      const micError = mapRecorderError(err);
      if (micError.message === "") return;

      setState((current) => ({
        ...current,
        isRecording: false,
        micStatus: micError.kind === "unsupported" ? "unsupported" : "blocked",
        micError,
        error: formatMicErrorForDisplay(micError),
      }));
    }
  }, [createNativeAdapter, createWebAdapter]);

  const stopRecording = useCallback(async () => {
    const adapter = adapterRef.current;
    if (!adapter) return;

    setState((current) => ({ ...current, isRecording: false }));

    try {
      const result = await adapter.stop();
      applyRecordingResult(result, false);
    } catch {
      setState((current) => ({
        ...current,
        isRecording: false,
        error: "Couldn't finish recording — try again.",
      }));
    }
  }, [applyRecordingResult]);

  stopRecordingRef.current = stopRecording;

  const startFileCapture = useCallback(async () => {
    setState((current) => ({
      ...current,
      error: null,
      audioBlob: null,
      recordedMimeType: "",
      peaks: [],
    }));

    try {
      const result = await captureAudioFile();
      applyRecordingResult(result, true);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      const micError = mapRecorderError(err);
      setState((current) => ({
        ...current,
        error:
          micError.message || "Couldn't use your phone's recorder — try again.",
        micError,
      }));
    }
  }, [applyRecordingResult]);

  const reset = useCallback(() => {
    adapterRef.current?.reset();
    adapterRef.current = null;
    setState((current) => ({
      isRecording: false,
      durationSeconds: 0,
      livePeaks: Array.from({ length: 30 }, () => 0.08),
      audioBlob: null,
      recordedMimeType: "",
      peaks: [],
      error: null,
      micStatus: current.micStatus,
      micError: current.micError,
      usedFileCapture: false,
      canUseWebRecorder: current.canUseWebRecorder,
      isNativeApp: current.isNativeApp,
    }));
  }, []);

  return {
    ...state,
    requestMicAccess,
    startRecording,
    stopRecording,
    startFileCapture,
    reset,
    maxDurationSeconds: MAX_RECORDING_SECONDS,
  };
}
