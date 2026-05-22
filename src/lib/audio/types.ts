export type RecorderResult = {
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
  peaks: number[];
};

export type RecorderErrorCode =
  | "permission_denied"
  | "permission_blocked"
  | "unsupported"
  | "unknown";

export function permissionDeniedError(blocked: boolean): RecorderError {
  return {
    code: blocked ? "permission_blocked" : "permission_denied",
    message: blocked
      ? "Microphone access is blocked"
      : "Microphone permission denied",
  };
}

export type RecorderError = {
  code: RecorderErrorCode;
  message: string;
};

export type MicrophonePermissionState =
  | "granted"
  | "denied"
  | "prompt"
  | "unsupported";

export type AudioRecorderAdapter = {
  requestPermission(): Promise<MicrophonePermissionState>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<RecorderResult>;
  cancelRecording(): Promise<void>;
  getCurrentAmplitude?(): Promise<number>;
};
