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
import { RecordButton } from "@/components/voice-note/RecordButton";
import { formatDuration } from "@/components/voice-note/format-duration";
import { VoiceNotePageSkeleton } from "@/components/ui/Skeleton";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { REACHABILITY_ERROR, fetchJson } from "@/lib/api/fetch-client";
import { trackEvent } from "@/lib/analytics/events";
import type { FriendProfile } from "@/lib/api/types";

type VoiceNoteScreenProps = {
  friendId: string;
};

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

function firstName(name: string | null | undefined) {
  return name?.trim().split(/\s+/)[0] ?? "";
}

function shareText(friendName: string | null | undefined) {
  const name = firstName(friendName);
  return name
    ? `Hey ${name}, I left you a quick voice note —`
    : "Hey — I left you a quick voice note —";
}

function shareTitle(senderName: string | null | undefined) {
  const name = firstName(senderName);
  return name ? `Voice note from ${name}` : "a KinMatch voice note";
}

async function parseSendError(res: Response) {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error ?? "Couldn't send that note — try again.";
}

export function VoiceNoteScreen({ friendId }: VoiceNoteScreenProps) {
  const router = useRouter();
  const [friend, setFriend] = useState<Pick<
    FriendProfile,
    "id" | "name" | "avatar_color"
  > | null>(null);
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
        sender_name: string | null;
      };

      trackEvent("voice_note_sent", { share_sheet: "1" });

      if (navigator.share && sendData.public_url) {
        try {
          await navigator.share({
            url: sendData.public_url,
            text: shareText(sendData.friend_name),
            title: shareTitle(sendData.sender_name),
          });
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
      } else if (sendData.public_url && navigator.clipboard) {
        await navigator.clipboard.writeText(sendData.public_url);
        setSendStatus("idle");
        setSendNotice("Link copied — paste to send");
        return;
      } else {
        setSendStatus("error");
        setSendError("Couldn't copy the link — try again.");
        return;
      }

      await fetch(`/api/voice-notes/${sendData.voice_note.id}/send`, {
        method: "POST",
      });

      router.push("/today");
    } catch {
      setSendStatus("error");
      setSendError(REACHABILITY_ERROR);
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

  const helperText = recorder.isRecording
    ? "Recording… tap to stop"
    : recorder.audioBlob
      ? "Tap send when you're ready"
      : "Tap to start recording";

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
          <LiveWaveform
            peaks={recorder.livePeaks}
            active={recorder.isRecording || Boolean(recorder.audioBlob)}
            className="mb-8 w-full"
          />

          <RecordButton
            isRecording={recorder.isRecording}
            disabled={sendStatus === "uploading"}
            onPress={() => {
              if (recorder.isRecording) {
                recorder.stopRecording();
                return;
              }
              if (!recorder.audioBlob) {
                void recorder.startRecording();
              }
            }}
          />

          <p className="mt-5 font-mono text-sm text-ink">
            {formatDuration(recorder.durationSeconds)}
            {recorder.maxDurationSeconds > 0 && (
              <span className="text-ink-soft">
                {" "}
                / {formatDuration(recorder.maxDurationSeconds)}
              </span>
            )}
          </p>

          <Subhead className="mt-2 text-center">{helperText}</Subhead>

          {recorder.error && (
            <div className="mt-4 max-w-[320px] space-y-3 text-center">
              <p
                className="font-inter text-sm italic text-terracotta-deep"
                role="alert"
              >
                {recorder.error}
              </p>
              <p className="font-inter text-xs italic leading-relaxed text-ink-soft">
                If your phone already blocked it, turn on microphone access in
                browser settings, then try again.
              </p>
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
          {recorder.error && !recorder.audioBlob && (
            <PrimaryButton
              type="button"
              disabled={sendStatus === "uploading"}
              onClick={() => void recorder.startRecording()}
            >
              Try microphone again
            </PrimaryButton>
          )}

          {recorder.audioBlob && (
            <>
              <PrimaryButton
                type="button"
                disabled={sendStatus === "uploading"}
                onClick={() => void handleSend()}
              >
                {sendStatus === "uploading"
                  ? "Sending…"
                  : `Share with ${friend.name}`}
              </PrimaryButton>

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
