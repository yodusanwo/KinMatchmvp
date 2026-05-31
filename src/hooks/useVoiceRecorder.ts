"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  canRecordInBrowser,
} from "@/lib/audio/mime-type";
import {
  formatMicError,
  hasGetUserMedia,
  requestMicAccess as requestMicAccessCore,
  type MicErrorInfo,
} from "@/lib/audio/mic-permission";
import {
  captureAudioFile,
  mapRecorderError,
  WebMediaRecorderAdapter,
} from "@/lib/audio/recorder-adapter";
import { MAX_RECORDING_SECONDS } from "@/lib/voice-notes/peaks";

export type MicStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "blocked"
  | "unsupported";

export type VoiceRecorderState = {
  isRecording: boolean;
  durationSeconds: number;
  livePeaks: number[];
  audioBlob: Blob | null;
  recordedMimeType: string;
  peaks: number[];
  error: string | null;
  micStatus: MicStatus;
  micError: MicErrorInfo | null;
  usedFileCapture: boolean;
  canUseWebRecorder: boolean;
};

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
  });

  const adapterRef = useRef<WebMediaRecorderAdapter | null>(null);

  useEffect(() => {
    setState((current) => ({
      ...current,
      canUseWebRecorder: hasGetUserMedia() && canRecordInBrowser(),
    }));
  }, []);

  useEffect(() => {
    return () => {
      adapterRef.current?.reset();
    };
  }, []);

  const applyRecordingResult = useCallback(
    (result: {
      blob: Blob;
      mimeType: string;
      durationSeconds: number;
      peaks: number[];
    }, usedFileCapture: boolean) => {
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
    []
  );

  const requestMicAccess = useCallback(async (): Promise<boolean> => {
    setState((current) => ({
      ...current,
      micStatus: "requesting",
      micError: null,
      error: null,
    }));

    const result = await requestMicAccessCore();

    if (result.ok) {
      setState((current) => ({
        ...current,
        micStatus: "ready",
        micError: null,
        error: null,
        canUseWebRecorder: canRecordInBrowser(),
      }));
      return true;
    }

    const micStatus =
      result.error.kind === "unsupported" ? "unsupported" : "blocked";

    setState((current) => ({
      ...current,
      micStatus,
      micError: result.error,
      error: formatMicError(result.error),
    }));
    return false;
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

    try {
      if (!adapterRef.current) {
        adapterRef.current = new WebMediaRecorderAdapter((update) => {
          setState((current) => ({
            ...current,
            durationSeconds: update.durationSeconds,
            livePeaks: update.livePeaks,
          }));
        });
      }

      await adapterRef.current.start();
      setState((current) => ({
        ...current,
        isRecording: true,
        durationSeconds: 0,
        livePeaks: Array.from({ length: 30 }, () => 0.08),
        micStatus: "ready",
        error: null,
      }));
    } catch (err) {
      adapterRef.current?.reset();
      const micError = mapRecorderError(err);
      if (micError.message === "") return;

      setState((current) => ({
        ...current,
        isRecording: false,
        micStatus:
          micError.kind === "unsupported" ? "unsupported" : "blocked",
        micError,
        error: formatMicError(micError),
      }));
    }
  }, []);

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
        error: micError.message || "Couldn't use your phone's recorder — try again.",
        micError,
      }));
    }
  }, [applyRecordingResult]);

  const reset = useCallback(() => {
    adapterRef.current?.reset();
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
