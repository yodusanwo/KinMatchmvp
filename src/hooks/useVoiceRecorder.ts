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

export function useVoiceRecorder() {
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
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
    }));
  }, []);

  const requestPermission = useCallback(async () => {
    setError(null);
    const permission = await requestMicrophonePermission();
    setState((current) => ({ ...current, permissionState: permission }));

    if (permission === "granted") return true;
    if (permission === "denied") {
      setError(permissionDeniedError(true));
    } else if (permission === "prompt") {
      setError({
        code: "permission_denied",
        message: "Allow the microphone when your device asks.",
      });
    }
    return false;
  }, [setError]);

  const startRecording = useCallback(async () => {
    const permission = await queryMicrophonePermission();
    if (permission !== "granted") {
      const allowed = await requestPermission();
      if (!allowed) return;
    }

    setError(null);
    setState((current) => ({
      ...current,
      audioBlob: null,
      recordedMimeType: "",
      peaks: [],
      durationSeconds: 0,
      livePeaks: IDLE_PEAKS,
    }));

    try {
      const adapter = adapterRef.current ?? getAudioRecorder();
      adapterRef.current = adapter;
      await adapter.startRecording();
      startedAtRef.current = Date.now();

      setState((current) => ({
        ...current,
        isRecording: true,
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
  }, [clearTimers, setError, requestPermission]);

  const stopRecording = useCallback(async () => {
    clearTimers();
    setState((current) => ({ ...current, isRecording: false }));

    try {
      const result = await adapterRef.current.stopRecording();
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
    void adapterRef.current.cancelRecording();
    setState({
      isRecording: false,
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
    ensureMicrophoneReady,
    loadFromFile,
    openAppSettings,
    reset,
    maxDurationSeconds: MAX_RECORDING_SECONDS,
  };
}
