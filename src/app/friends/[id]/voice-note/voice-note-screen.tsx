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
import { MicrophonePermissionCard } from "@/components/voice-note/MicrophonePermissionCard";
import { VoiceNotesMicSetupSection } from "@/components/voice-note/VoiceNotesMicSetupSection";
import { RecordButton } from "@/components/voice-note/RecordButton";
import { useVoiceNotesMicSetup } from "@/hooks/useVoiceNotesMicSetup";
import { formatDuration } from "@/components/voice-note/format-duration";
import { VoiceNotePageSkeleton } from "@/components/ui/Skeleton";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { fetchJson } from "@/lib/api/fetch-client";
import {
  parseApiError,
  voiceNoteFilename,
} from "@/lib/api/parse-api-error";
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
  const micSetup = useVoiceNotesMicSetup();

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

    if (recorder.audioBlob.size < 100) {
      setSendStatus("error");
      setSendError("That recording didn't save — try recording again.");
      return;
    }

    setSendStatus("uploading");
    setSendError(null);

    const mimeType =
      recorder.recordedMimeType ||
      recorder.audioBlob.type ||
      "audio/mp4";
    const formData = new FormData();
    formData.append(
      "audio",
      recorder.audioBlob,
      voiceNoteFilename(mimeType)
    );
    formData.append("friend_id", friend.id);
    formData.append("duration", String(Math.max(1, recorder.durationSeconds)));
    formData.append("mime_type", mimeType);
    formData.append("peaks", JSON.stringify(recorder.peaks));

    try {
      const sendRes = await fetch("/api/voice-notes/send", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!sendRes.ok) {
        setSendStatus("error");
        setSendError(await parseApiError(sendRes));
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

  const micIsReady =
    micSetup.micIsReady || recorder.permissionState === "granted";
  const showMicSetup =
    !micIsReady &&
    !recorder.audioBlob &&
    !recorder.isRecording &&
    !recorder.isStarting &&
    !recorder.isStopping;

  async function handleMicSetup() {
    const allowed = await micSetup.requestMicrophone();
    if (allowed) {
      await recorder.refreshPermissionState();
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
    : recorder.isStarting
      ? "Starting…"
      : recorder.isStopping
        ? "Saving your note…"
    : recorder.audioBlob
      ? "Tap send when you're ready"
      : showMicSetup
        ? "Set up voice notes first, then tap to record"
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
          {showMicSetup && (
            <VoiceNotesMicSetupSection
              micStatus={micSetup.micStatus}
              micMessage={micSetup.micMessage}
              onSetup={handleMicSetup}
              setupDisabled={sendStatus === "uploading"}
            />
          )}

          <LiveWaveform
            peaks={recorder.livePeaks}
            active={
              recorder.isStarting ||
              recorder.isRecording ||
              recorder.isStopping ||
              Boolean(recorder.audioBlob)
            }
            className="mb-8 w-full"
          />

          {!showMicSetup && (
            <RecordButton
              isRecording={recorder.isRecording || recorder.isStarting}
              disabled={
                sendStatus === "uploading" ||
                recorder.isStarting ||
                recorder.isStopping
              }
              onPress={() => {
                if (recorder.isRecording) {
                  void recorder.stopRecording();
                  return;
                }
                if (!recorder.audioBlob) {
                  void recorder.startRecording();
                }
              }}
            />
          )}

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

          {!showMicSetup &&
            recorder.error &&
            (recorder.errorCode === "permission_denied" ||
              recorder.errorCode === "permission_blocked" ||
              recorder.errorCode === "unsupported") && (
              <MicrophonePermissionCard
                errorCode={recorder.errorCode}
                message={recorder.error}
                isNative={recorder.isNative}
                permissionState={recorder.permissionState}
                disabled={sendStatus === "uploading"}
                onRequestPermission={async () => {
                  const allowed = await micSetup.requestMicrophone();
                  if (allowed) {
                    await recorder.refreshPermissionState();
                  }
                }}
                onRetryRecording={recorder.startRecording}
              />
            )}

          {!showMicSetup &&
            recorder.error &&
            recorder.errorCode !== "permission_denied" &&
            recorder.errorCode !== "permission_blocked" &&
            recorder.errorCode !== "unsupported" && (
              <p
                className="mt-4 font-inter text-sm italic text-terracotta-deep"
                role="alert"
              >
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
          <PrimaryButton
            type="button"
            disabled={
              (!recorder.audioBlob && !recorder.isRecording) ||
              recorder.isStarting ||
              recorder.isStopping ||
              sendStatus === "uploading"
            }
            onClick={() => {
              if (recorder.isRecording) {
                void recorder.stopRecording();
                return;
              }
              if (recorder.audioBlob) {
                void handleSend();
              }
            }}
          >
            {sendStatus === "uploading"
              ? "Sending…"
              : recorder.isStarting
                ? "Starting…"
                : recorder.isStopping
                  ? "Saving…"
                  : recorder.isRecording
                    ? "Stop recording"
                    : recorder.audioBlob
                      ? `Share with ${friend.name}`
                      : "Record first"}
          </PrimaryButton>

          {recorder.audioBlob && (
            <p className="text-center">
              <button
                type="button"
                onClick={recorder.reset}
                className="font-inter text-sm text-terracotta underline underline-offset-2"
              >
                Record again
              </button>
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
