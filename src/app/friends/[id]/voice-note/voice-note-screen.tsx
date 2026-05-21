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

    const formData = new FormData();
    const mimeType = recorder.recordedMimeType || recorder.audioBlob.type || "audio/webm";
    formData.append("audio", recorder.audioBlob, "voice-note");
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
        const data = await sendRes.json().catch(() => ({}));
        setSendStatus("error");
        setSendError(
          (data as { error?: string }).error ?? REACHABILITY_ERROR
        );
        return;
      }

      const sendData = (await sendRes.json()) as {
        voice_note: { id: string };
        public_url: string;
        friend_name: string;
      };

      trackEvent("voice_note_sent", { share_sheet: "1" });

      let shareTriggered = false;
      if (navigator.share && sendData.public_url) {
        try {
          const sharePromise = navigator.share({
            url: sendData.public_url,
            text: `Hey ${sendData.friend_name} — sent you a quick voice note.`,
            title: "Voice note from KinMatch",
          });
          shareTriggered = true;
          await sharePromise;
        } catch {
          // Share sheets can be cancelled; the voice note is already saved.
        }
      } else if (sendData.public_url && navigator.clipboard) {
        await navigator.clipboard.writeText(sendData.public_url);
        shareTriggered = true;
      }

      if (shareTriggered) {
        await fetch(`/api/voice-notes/${sendData.voice_note.id}/send`, {
          method: "POST",
        });
      }

      router.push("/today");
    } catch {
      setSendStatus("error");
      setSendError("Couldn't send — try again");
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
            <p className="mt-4 font-inter text-sm italic text-terracotta-deep" role="alert">
              {recorder.error}
            </p>
          )}

          {sendError && (
            <p className="mt-4 font-inter text-sm italic text-terracotta-deep" role="alert">
              {sendError}
            </p>
          )}
        </div>

        <div className="mt-8 space-y-4">
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
