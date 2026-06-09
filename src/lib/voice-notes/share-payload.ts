import { firstName } from "@/lib/voice-notes/public-voice-note";

export function voiceNoteShareText(friendName: string | null | undefined) {
  const name = firstName(friendName);
  return name
    ? `Hey ${name}, I left you a quick voice note:`
    : "Hey, I left you a quick voice note:";
}

export function voiceNoteShareTitle(senderName: string | null | undefined) {
  const name = firstName(senderName);
  return name ? `Voice note from ${name}` : "a KinMatch voice note";
}

export function voiceNoteMessageBody(
  friendName: string | null | undefined,
  publicUrl: string
) {
  return `${voiceNoteShareText(friendName)}\n${publicUrl}`;
}

/** iOS/Android share sheets usually honor separate text + url fields. */
export function isMobileShareTarget() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function buildVoiceNoteShareData(params: {
  publicUrl: string;
  friendName: string | null | undefined;
  senderName: string | null | undefined;
}): ShareData {
  const title = voiceNoteShareTitle(params.senderName);
  const text = voiceNoteShareText(params.friendName);
  const messageBody = voiceNoteMessageBody(params.friendName, params.publicUrl);

  if (isMobileShareTarget()) {
    return {
      title,
      text,
      url: params.publicUrl,
    };
  }

  // macOS Messages often ignores `text` when `url` is also set, send one body.
  return {
    title,
    text: messageBody,
  };
}
