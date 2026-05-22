import { REACHABILITY_ERROR } from "@/lib/api/fetch-client";

export async function parseApiError(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (data.error) return data.error;
  } else {
    const text = await response.text().catch(() => "");
    if (text && text.length < 200) return text;
  }

  if (response.status === 401) {
    return "Sign in again to send this note.";
  }
  if (response.status === 413) {
    return "That recording is too large — try a shorter note.";
  }
  if (response.status >= 500) {
    return "KinMatch couldn't save that recording. Try again in a moment.";
  }

  return REACHABILITY_ERROR;
}

export function voiceNoteFilename(mimeType: string): string {
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) {
    return "voice-note.m4a";
  }
  if (mimeType.includes("mpeg")) return "voice-note.mp3";
  if (mimeType.includes("ogg")) return "voice-note.ogg";
  return "voice-note.webm";
}
