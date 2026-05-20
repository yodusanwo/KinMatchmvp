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
import type {
  CreateVoiceNoteResponse,
  SendVoiceNoteResponse,
} from "@/lib/api/voice-notes";

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

    const createResult = await fetchJson<CreateVoiceNoteResponse>(
      "/api/voice-notes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend_id: friend.id }),
      }
    );

    if (!createResult.ok) {
      setSendStatus("error");
      setSendError(createResult.error);
      return;
    }

    const { id } = createResult.data;

    const formData = new FormData();
    formData.append("audio", recorder.audioBlob, "voice-note.webm");
    formData.append(
      "duration_seconds",
      String(Math.max(1, recorder.durationSeconds))
    );
    formData.append("peaks", JSON.stringify(recorder.peaks));

    try {
      const finalizeRes = await fetch(`/api/voice-notes/${id}/finalize`, {
        method: "POST",
        body: formData,
      });
      if (!finalizeRes.ok) {
        const data = await finalizeRes.json().catch(() => ({}));
        setSendStatus("error");
        setSendError(
          (data as { error?: string }).error ?? REACHABILITY_ERROR
        );
        return;
      }
    } catch {
      setSendStatus("error");
      setSendError(REACHABILITY_ERROR);
      return;
    }

    const sendResult = await fetchJson<SendVoiceNoteResponse>(
      `/api/voice-notes/${id}/send`,
      { method: "POST" }
    );

    if (!sendResult.ok) {
      setSendStatus("error");
      setSendError(sendResult.error);
      return;
    }

    const sendData = sendResult.data;

    trackEvent("voice_note_sent", { share_sheet: "1" });

    if (navigator.share && sendData.listen_url) {
      try {
        await navigator.share({
          url: sendData.listen_url,
          text: `Hey ${friend.name} — sent you a quick voice note.`,
          title: "Voice note from KinMatch",
        });
      } catch {
        // Share sheets can be cancelled; the voice note is already saved.
      }
    }

    router.push(`/friends/${friend.id}?voice_note_sent=1`);
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
