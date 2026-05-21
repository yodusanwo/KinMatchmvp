export function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
    "audio/ogg;codecs=opus",
    "",
  ];

  for (const type of candidates) {
    if (type === "" || MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "";
}
