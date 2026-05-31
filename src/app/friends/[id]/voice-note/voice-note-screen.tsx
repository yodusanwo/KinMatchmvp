"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BrandBar,
  Eyebrow,
  Headline,
  PrimaryButton,
  Subhead,
} from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import { LiveWaveform } from "@/components/voice-note/LiveWaveform";
import { MicEnableFlow } from "@/components/voice-note/MicEnableFlow";
import { RecordButton } from "@/components/voice-note/RecordButton";
import { formatDuration } from "@/components/voice-note/format-duration";
import { VoiceNotePageSkeleton } from "@/components/ui/Skeleton";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { fileCaptureActionLabel } from "@/lib/audio/mic-permission";
import { REACHABILITY_ERROR, fetchJson } from "@/lib/api/fetch-client";
import { trackEvent } from "@/lib/analytics/events";
import type { FriendCategory, FriendProfile } from "@/lib/api/types";
import { firstName } from "@/lib/memories/categories";
import { buildSmsLink } from "@/lib/phones/sms-link";
import { pickShareText } from "@/lib/share-text/voice-note-variants";
import {
  buildVoiceNoteShareData,
  isMobileShareTarget,
} from "@/lib/voice-notes/share-payload";

type VoiceNoteScreenProps = {
  friendId: string;
};

type FriendForSend = Pick<
  FriendProfile,
  "id" | "name" | "avatar_color" | "phone_number" | "category" | "days_quiet"
>;

function voiceNoteFilename(mimeType: string) {
  const extension = mimeType.includes("mp4")
    ? "m4a"
    : mimeType.includes("mpeg")
      ? "mp3"
      : mimeType.includes("ogg")
        ? "ogg"
        : "webm";
  return `voice-note.${extension}`;
}

async function parseSendError(res: Response) {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error ?? "Couldn't send that note — try again.";
}

async function markVoiceNoteSent(voiceNoteId: string) {
  const res = await fetch(`/api/voice-notes/${voiceNoteId}/send`, {
    method: "POST",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Couldn't mark as sent — try again.");
  }
}

export function VoiceNoteScreen({ friendId }: VoiceNoteScreenProps) {
  const router = useRouter();
  const [friend, setFriend] = useState<FriendForSend | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendStatus, setSendStatus] = useState<
    "idle" | "uploading" | "error"
  >("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendNotice, setSendNotice] = useState<string | null>(null);

  const recorder = useVoiceRecorder();

  const loadFriend = useCallback(async () => {
    const result = await fetchJson<FriendProfile>(`/api/friends/${friendId}`);
    if (result.status === 401) {
      router.replace(`/signin?next=/friends/${friendId}/voice-note`);
      return;
    }
    if (!result.ok) {
      router.replace("/today");
      return;
    }
    const data = result.data;
    setFriend({
      id: data.id,
      name: data.name,
      avatar_color: data.avatar_color,
      phone_number: data.phone_number,
      category: data.category,
      days_quiet: data.days_quiet,
    });
    setLoading(false);
  }, [friendId, router]);

  useEffect(() => {
    loadFriend();
  }, [loadFriend]);

  async function handleSend() {
    if (!friend || !recorder.audioBlob) return;

    setSendStatus("uploading");
    setSendError(null);
    setSendNotice(null);

    const formData = new FormData();
    const mimeType = recorder.recordedMimeType || recorder.audioBlob.type || "audio/webm";
    formData.append("audio", recorder.audioBlob, voiceNoteFilename(mimeType));
    formData.append("friend_id", friend.id);
    formData.append("duration", String(Math.max(1, recorder.durationSeconds)));
    formData.append("mime_type", mimeType);
    formData.append("peaks", JSON.stringify(recorder.peaks));

    try {
      const sendRes = await fetch("/api/voice-notes/send", {
        method: "POST",
        body: formData,
      });
      if (!sendRes.ok) {
        setSendStatus("error");
        setSendError(await parseSendError(sendRes));
        return;
      }

      const sendData = (await sendRes.json()) as {
        voice_note: { id: string };
        public_url: string;
        friend_name: string;
        friend_phone_number: string | null;
        friend_category: FriendCategory;
        friend_days_quiet: number;
        sender_name: string | null;
      };

      const { text } = pickShareText({
        friend_first_name: sendData.friend_name,
        days_quiet: sendData.friend_days_quiet,
        is_inner_circle: sendData.friend_category === "inner_circle",
      });

      const url = sendData.public_url;
      const fullBody = `${text} ${url}`;

      await markVoiceNoteSent(sendData.voice_note.id);

      const phone = sendData.friend_phone_number?.trim();

      if (phone) {
        trackEvent("voice_note_sent", { method: "sms" });
        window.location.href = buildSmsLink(phone, fullBody);
        return;
      }

      if (navigator.share && url) {
        try {
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(fullBody);
          }

          await navigator.share(
            buildVoiceNoteShareData({
              publicUrl: url,
              friendName: sendData.friend_name,
              senderName: sendData.sender_name,
            })
          );

          trackEvent("voice_note_sent", { method: "share_sheet" });

          if (!isMobileShareTarget()) {
            setSendNotice(
              "Message copied — paste into Messages if you only see the link"
            );
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            setSendStatus("idle");
            return;
          }
          setSendStatus("error");
          setSendError("Couldn't open sharing — try again.");
          console.error("Share failed", err);
          return;
        }
      } else if (url && navigator.clipboard) {
        await navigator.clipboard.writeText(fullBody);
        trackEvent("voice_note_sent", { method: "clipboard" });
        setSendStatus("idle");
        setSendNotice("Message copied — paste in your texts app");
        router.push("/today");
        return;
      } else {
        setSendStatus("error");
        setSendError("Couldn't copy the link — try again.");
        return;
      }

      router.push("/today");
    } catch (err) {
      setSendStatus("error");
      setSendError(
        err instanceof Error ? err.message : REACHABILITY_ERROR
      );
    }
  }

  if (loading || !friend) {
    return (
      <AppShell>
        <BrandBar />
        <div className="px-5">
          <VoiceNotePageSkeleton />
        </div>
      </AppShell>
    );
  }

  const displayName = firstName(friend.name);
  const hasPhone = Boolean(friend.phone_number?.trim());
  const micReady = recorder.micStatus === "ready";
  const showRecorder = micReady && !recorder.audioBlob;

  const helperText = recorder.isRecording
    ? "Recording… tap to stop"
    : recorder.audioBlob
      ? recorder.usedFileCapture
        ? "Ready to send"
        : "Tap send when you're ready"
      : micReady
        ? "Tap to start recording"
        : "Set up the microphone to begin";

  const sendButtonLabel =
    sendStatus === "uploading"
      ? "Sending…"
      : hasPhone
        ? "Send a voice note"
        : `Share with ${friend.name}`;

  const sendMethodHint = hasPhone
    ? "→ Opens in Messages"
    : `Add ${displayName}'s number for one-tap sending →`;

  return (
    <AppShell>
      <BrandBar />
      <div className="flex items-center border-b border-ink/[0.12] px-5 py-3">
        <Link
          href={`/friends/${friend.id}`}
          className="font-inter text-sm text-terracotta underline underline-offset-2"
        >
          ← Back
        </Link>
      </div>

      <div className="flex min-h-[calc(100vh-120px)] flex-col px-5 pb-10 pt-8">
        <div className="flex items-center gap-3">
          <MiniAvatar
            name={friend.name}
            avatarColor={friend.avatar_color}
            size="md"
          />
          <div>
            <Eyebrow>Voice note</Eyebrow>
            <Headline className="text-lg">{friend.name}</Headline>
          </div>
        </div>

        <div className="mt-10 flex flex-1 flex-col items-center justify-center">
          {(micReady || recorder.audioBlob) && (
            <LiveWaveform
              peaks={recorder.livePeaks}
              active={recorder.isRecording || Boolean(recorder.audioBlob)}
              className="mb-8 w-full"
            />
          )}

          {!micReady && !recorder.audioBlob ? (
            <MicEnableFlow
              friendName={friend.name}
              micStatus={recorder.micStatus}
              micError={recorder.micError}
              disabled={sendStatus === "uploading"}
              onEnable={() => recorder.requestMicAccess()}
              onUsePhoneRecorder={() => void recorder.startFileCapture()}
            />
          ) : showRecorder ? (
            <RecordButton
              isRecording={recorder.isRecording}
              disabled={sendStatus === "uploading"}
              onPress={() => {
                if (recorder.isRecording) {
                  void recorder.stopRecording();
                  return;
                }
                void recorder.startRecording();
              }}
            />
          ) : null}

          {(micReady || recorder.audioBlob) && (
            <p className="mt-5 font-mono text-sm text-ink">
              {formatDuration(recorder.durationSeconds)}
              {recorder.maxDurationSeconds > 0 && !recorder.usedFileCapture && (
                <span className="text-ink-soft">
                  {" "}
                  / {formatDuration(recorder.maxDurationSeconds)}
                </span>
              )}
            </p>
          )}

          <Subhead className="mt-2 text-center">{helperText}</Subhead>

          {recorder.error && !recorder.audioBlob && micReady && (
            <div className="mt-4 max-w-[320px] space-y-3 text-center">
              <p
                className="font-inter text-sm italic text-terracotta-deep"
                role="alert"
              >
                {recorder.error}
              </p>
              {recorder.micError?.settingsHint && (
                <p className="font-inter text-xs italic leading-relaxed text-ink-soft">
                  {recorder.micError.settingsHint}
                </p>
              )}
            </div>
          )}

          {sendError && (
            <p className="mt-4 font-inter text-sm italic text-terracotta-deep" role="alert">
              {sendError}
            </p>
          )}

          {sendNotice && (
            <p className="mt-4 font-inter text-sm italic text-ink-soft" role="status">
              {sendNotice}
            </p>
          )}
        </div>

        <div className="mt-8 space-y-4">
          {recorder.error && !recorder.audioBlob && micReady && (
            <>
              <PrimaryButton
                type="button"
                disabled={sendStatus === "uploading"}
                onClick={() => void recorder.startRecording()}
              >
                Try again
              </PrimaryButton>
              <p className="text-center">
                <button
                  type="button"
                  disabled={sendStatus === "uploading"}
                  onClick={() => void recorder.startFileCapture()}
                  className="font-inter text-sm text-terracotta underline underline-offset-2"
                >
                  {fileCaptureActionLabel()}
                </button>
              </p>
            </>
          )}

          {recorder.audioBlob && (
            <>
              <PrimaryButton
                type="button"
                disabled={sendStatus === "uploading"}
                onClick={() => void handleSend()}
              >
                {sendButtonLabel}
              </PrimaryButton>

              <p className="text-center">
                {hasPhone ? (
                  <span className="font-inter text-[11px] italic text-ink-soft">
                    {sendMethodHint}
                  </span>
                ) : (
                  <Link
                    href={`/friends/${friend.id}`}
                    className="font-inter text-[11px] italic text-terracotta underline decoration-terracotta/60 underline-offset-2"
                  >
                    {sendMethodHint}
                  </Link>
                )}
              </p>

              <p className="text-center">
                <button
                  type="button"
                  onClick={recorder.reset}
                  className="font-inter text-sm text-terracotta underline underline-offset-2"
                >
                  Record again
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
