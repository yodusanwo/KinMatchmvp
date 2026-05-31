import { isIOS } from "@/lib/audio/mic-permission";

const WEBM_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
];

const IOS_CANDIDATES = ["audio/mp4", "audio/aac", "audio/webm", ""];

const DEFAULT_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg;codecs=opus",
  "",
];

function pickMime(candidates: string[]): string {
  if (typeof MediaRecorder === "undefined") return "";

  for (const type of candidates) {
    if (type === "" || MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "";
}

export function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return pickMime(isIOS() ? IOS_CANDIDATES : DEFAULT_CANDIDATES);
}

export function canRecordInBrowser(): boolean {
  return isIOS()
    ? getSupportedAudioMimeType() !== "" || typeof MediaRecorder !== "undefined"
    : getSupportedAudioMimeType() !== "" ||
        (typeof MediaRecorder !== "undefined" && WEBM_CANDIDATES.some(
          (type) => MediaRecorder.isTypeSupported(type)
        ));
}
