"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { openAppSettings, isNativePlatform } from "@/lib/audio/platform";
import { queryMicrophonePermission, recorderErrorMessage } from "@/lib/audio/permissions";
import {
  enrichResultFromFile,
  getAudioRecorder,
  isRecorderError,
  MAX_RECORDING_SECONDS,
  requestMicrophonePermission,
  resetAudioRecorder,
  type RecorderErrorCode,
} from "@/lib/audio/recorder";
import {
  permissionDeniedError,
  type RecorderError,
} from "@/lib/audio/types";
import { downsamplePeaks } from "@/lib/voice-notes/peaks";

export type VoiceRecorderState = {
  isRecording: boolean;
  isStarting: boolean;
  durationSeconds: number;
  livePeaks: number[];
  audioBlob: Blob | null;
  recordedMimeType: string;
  peaks: number[];
  error: string | null;
  errorCode: RecorderErrorCode | null;
  permissionState: "unknown" | "granted" | "denied" | "prompt" | "unsupported";
  isNative: boolean;
};

const IDLE_PEAKS = Array.from({ length: 30 }, () => 0.08);
const START_RECORDING_TIMEOUT_MS = 8_000;

function timeoutAfter(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject({
        code: "unknown",
        message: "Recording did not start. Try again.",
      } satisfies RecorderError);
    }, ms);
  });
}

export function useVoiceRecorder() {
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    isStarting: false,
    durationSeconds: 0,
    livePeaks: IDLE_PEAKS,
    audioBlob: null,
    recordedMimeType: "",
    peaks: [],
    error: null,
    errorCode: null,
    permissionState: "unknown",
    isNative: false,
  });

  const adapterRef = useRef<ReturnType<typeof getAudioRecorder> | null>(null);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const amplitudeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (amplitudeRef.current) {
      clearInterval(amplitudeRef.current);
      amplitudeRef.current = null;
    }
  }, []);

  useEffect(() => {
    resetAudioRecorder();
    adapterRef.current = getAudioRecorder();
    const isNative = isNativePlatform();
    setState((current) => ({ ...current, isNative }));

    void queryMicrophonePermission().then((permissionState) => {
      setState((current) => ({ ...current, permissionState }));
    });

    const adapter = adapterRef.current;
    return () => {
      clearTimers();
      void adapter.cancelRecording();
    };
  }, [clearTimers]);

  const setError = useCallback((error: RecorderError | null) => {
    if (!error) {
      setState((current) => ({
        ...current,
        error: null,
        errorCode: null,
      }));
      return;
    }

    setState((current) => ({
      ...current,
      error: recorderErrorMessage(error),
      errorCode: error.code,
      isRecording: false,
      isStarting: false,
    }));
  }, []);

  const refreshPermissionState = useCallback(async () => {
    const permission = await queryMicrophonePermission();
    setState((current) => ({
      ...current,
      permissionState: permission,
    }));
    if (permission === "granted") {
      setError(null);
    }
    return permission;
  }, [setError]);

  const requestPermission = useCallback(async () => {
    setError(null);
    const permission = await requestMicrophonePermission();
    setState((current) => ({ ...current, permissionState: permission }));

    if (permission === "granted") return true;

    if (permission === "unsupported") {
      setError({
        code: "unsupported",
        message: "Voice recording isn't supported in this browser.",
      });
      return false;
    }

    setError(permissionDeniedError(permission === "denied"));
    return false;
  }, [setError]);

  const startRecording = useCallback(async () => {
    if (state.isStarting || state.isRecording) return;

    const permission = await queryMicrophonePermission();
    if (permission !== "granted") {
      const allowed = await requestPermission();
      if (!allowed) return;
    }

    setError(null);
    setState((current) => ({
      ...current,
      isStarting: true,
      audioBlob: null,
      recordedMimeType: "",
      peaks: [],
      durationSeconds: 0,
      livePeaks: IDLE_PEAKS,
    }));

    try {
      const adapter = adapterRef.current ?? getAudioRecorder();
      adapterRef.current = adapter;
      await Promise.race([
        adapter.startRecording(),
        timeoutAfter(START_RECORDING_TIMEOUT_MS),
      ]);
      startedAtRef.current = Date.now();

      setState((current) => ({
        ...current,
        isRecording: true,
        isStarting: false,
        permissionState: "granted",
      }));

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - startedAtRef.current) / 1000
        );
        setState((current) => ({ ...current, durationSeconds: elapsed }));
      }, 250);

      if (adapter.getCurrentAmplitude) {
        amplitudeRef.current = setInterval(() => {
          void adapter.getCurrentAmplitude?.().then((level) => {
            setState((current) => {
              const samples = [
                ...current.livePeaks.slice(-29),
                Math.min(1, Math.max(0.06, level)),
              ];
              return {
                ...current,
                livePeaks: downsamplePeaks(samples, 30),
              };
            });
          });
        }, 120);
      } else {
        amplitudeRef.current = setInterval(() => {
          setState((current) => {
            const samples = [
              ...current.livePeaks.slice(-29),
              0.08 + Math.random() * 0.32,
            ];
            return {
              ...current,
              livePeaks: downsamplePeaks(samples, 30),
            };
          });
        }, 120);
      }
    } catch (err) {
      clearTimers();
      setState((current) => ({
        ...current,
        isRecording: false,
        isStarting: false,
      }));
      const adapter = adapterRef.current;
      if (adapter) {
        void adapter.cancelRecording();
      }
      if (isRecorderError(err)) {
        const permission = await queryMicrophonePermission();
        const blocked = permission === "denied";
        setError(
          err.code === "permission_denied" && blocked
            ? permissionDeniedError(true)
            : err
        );
        setState((current) => ({
          ...current,
          permissionState: permission,
        }));
      } else {
        setError({ code: "unknown", message: "Could not start recording" });
      }
    }
  }, [
    clearTimers,
    setError,
    requestPermission,
    state.isRecording,
    state.isStarting,
  ]);

  const stopRecording = useCallback(async () => {
    clearTimers();
    setState((current) => ({
      ...current,
      isRecording: false,
      isStarting: false,
    }));

    const adapter = adapterRef.current ?? getAudioRecorder();
    adapterRef.current = adapter;

    try {
      const result = await adapter.stopRecording();
      setState((current) => ({
        ...current,
        durationSeconds: result.durationSeconds,
        audioBlob: result.blob,
        recordedMimeType: result.mimeType,
        peaks: result.peaks,
        livePeaks: result.peaks,
        error: null,
        errorCode: null,
      }));
    } catch (err) {
      if (isRecorderError(err)) {
        setError(err);
      } else {
        setError({ code: "unknown", message: "Could not stop recording" });
      }
    }
  }, [clearTimers, setError]);

  const ensureMicrophoneReady = useCallback(async () => {
    if (state.permissionState === "granted") return true;
    return requestPermission();
  }, [requestPermission, state.permissionState]);

  const loadFromFile = useCallback(async (file: File) => {
    setError(null);
    clearTimers();
    try {
      const result = await enrichResultFromFile(file);
      setState((current) => ({
        ...current,
        isRecording: false,
        isStarting: false,
        durationSeconds: result.durationSeconds,
        audioBlob: result.blob,
        recordedMimeType: result.mimeType,
        peaks: result.peaks,
        livePeaks: result.peaks,
        error: null,
        errorCode: null,
      }));
    } catch {
      setError({ code: "unknown", message: "Could not use that recording" });
    }
  }, [clearTimers, setError]);

  const reset = useCallback(() => {
    clearTimers();
    const adapter = adapterRef.current ?? getAudioRecorder();
    void adapter.cancelRecording();
    setState({
      isRecording: false,
      isStarting: false,
      durationSeconds: 0,
      livePeaks: IDLE_PEAKS,
      audioBlob: null,
      recordedMimeType: "",
      peaks: [],
      error: null,
      errorCode: null,
      permissionState: state.permissionState,
      isNative: isNativePlatform(),
    });
  }, [clearTimers, state.permissionState]);

  return {
    ...state,
    startRecording,
    stopRecording,
    requestPermission,
    refreshPermissionState,
    ensureMicrophoneReady,
    loadFromFile,
    openAppSettings,
    reset,
    maxDurationSeconds: MAX_RECORDING_SECONDS,
  };
}
