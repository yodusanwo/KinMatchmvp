"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  downsamplePeaks,
  MAX_RECORDING_SECONDS,
  readAnalyserLevel,
} from "@/lib/voice-notes/peaks";
import { getSupportedAudioMimeType } from "@/lib/audio/mime-type";

export type VoiceRecorderState = {
  isRecording: boolean;
  durationSeconds: number;
  livePeaks: number[];
  audioBlob: Blob | null;
  recordedMimeType: string;
  peaks: number[];
  error: string | null;
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
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const samplesRef = useRef<number[]>([]);
  const startedAtRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanupStream = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => cleanupStream, [cleanupStream]);

  const tickAnalyser = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const level = readAnalyserLevel(analyser);
    samplesRef.current.push(level);

    const live = downsamplePeaks(
      samplesRef.current.slice(-120),
      30
    );
    setState((current) => ({ ...current, livePeaks: live }));

    rafRef.current = requestAnimationFrame(tickAnalyser);
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    setState((current) => ({ ...current, isRecording: false }));
  }, []);

  const startRecording = useCallback(async () => {
    setState((current) => ({
      ...current,
      error: null,
      audioBlob: null,
      recordedMimeType: "",
      peaks: [],
    }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      await audioContext.resume();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = getSupportedAudioMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      samplesRef.current = [];
      startedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstart = () => {
        setState((current) => ({
          ...current,
          recordedMimeType: recorder.mimeType,
        }));
      };

      recorder.onstop = () => {
        cleanupStream();
        const recordedMimeType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, {
          type: recordedMimeType,
        });
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - startedAtRef.current) / 1000)
        );
        const peaks = downsamplePeaks(samplesRef.current, 30);

        setState((current) => ({
          ...current,
          isRecording: false,
          durationSeconds,
          audioBlob: blob,
          recordedMimeType,
          peaks,
          livePeaks: peaks,
        }));
      };

      recorder.start(200);
      setState((current) => ({
        ...current,
        isRecording: true,
        durationSeconds: 0,
        livePeaks: Array.from({ length: 30 }, () => 0.08),
      }));

      tickAnalyser();

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setState((current) => ({ ...current, durationSeconds: elapsed }));
        if (elapsed >= MAX_RECORDING_SECONDS) {
          stopRecording();
        }
      }, 250);
    } catch {
      cleanupStream();
      setState((current) => ({
        ...current,
        isRecording: false,
        error: "Microphone access is required to record a voice note.",
      }));
    }
  }, [cleanupStream, stopRecording, tickAnalyser]);

  const reset = useCallback(() => {
    cleanupStream();
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    samplesRef.current = [];
    setState({
      isRecording: false,
      durationSeconds: 0,
      livePeaks: Array.from({ length: 30 }, () => 0.08),
      audioBlob: null,
      recordedMimeType: "",
      peaks: [],
      error: null,
    });
  }, [cleanupStream]);

  return {
    ...state,
    startRecording,
    stopRecording,
    reset,
    maxDurationSeconds: MAX_RECORDING_SECONDS,
  };
}
