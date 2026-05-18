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
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
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
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendStatus, setSendStatus] = useState<
    "idle" | "uploading" | "error"
  >("idle");
  const [sendError, setSendError] = useState<string | null>(null);

  const recorder = useVoiceRecorder();

  const loadFriend = useCallback(async () => {
    const res = await fetch(`/api/friends/${friendId}`);
    if (res.status === 401) {
      router.replace(`/signin?next=/friends/${friendId}/voice-note`);
      return;
    }
    if (!res.ok) {
      router.replace("/today");
      return;
    }
    const data = (await res.json()) as FriendProfile;
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

    const createRes = await fetch("/api/voice-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friend_id: friend.id }),
    });

    if (!createRes.ok) {
      const data = await createRes.json().catch(() => ({}));
      setSendStatus("error");
      setSendError(
        (data as { error?: string }).error ?? "Could not start the upload."
      );
      return;
    }

    const { id } = (await createRes.json()) as CreateVoiceNoteResponse;

    const formData = new FormData();
    formData.append("audio", recorder.audioBlob, "voice-note.webm");
    formData.append(
      "duration_seconds",
      String(Math.max(1, recorder.durationSeconds))
    );
    formData.append("peaks", JSON.stringify(recorder.peaks));

    const finalizeRes = await fetch(`/api/voice-notes/${id}/finalize`, {
      method: "POST",
      body: formData,
    });

    if (!finalizeRes.ok) {
      const data = await finalizeRes.json().catch(() => ({}));
      setSendStatus("error");
      setSendError(
        (data as { error?: string }).error ?? "Could not save your recording."
      );
      return;
    }

    const sendRes = await fetch(`/api/voice-notes/${id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient_email: recipientEmail.trim() || undefined,
      }),
    });

    if (!sendRes.ok) {
      const data = await sendRes.json().catch(() => ({}));
      setSendStatus("error");
      setSendError(
        (data as { error?: string }).error ?? "Recording saved but send failed."
      );
      return;
    }

    const sendData = (await sendRes.json()) as SendVoiceNoteResponse;

    if (recipientEmail.trim() && sendData.error) {
      router.push(
        `/friends/${friend.id}?voice_note_sent=1&email_warning=1`
      );
      return;
    }

    router.push(`/friends/${friend.id}?voice_note_sent=1`);
  }

  if (loading || !friend) {
    return (
      <AppShell>
        <BrandBar />
        <p className="px-5 py-10 font-inter text-sm italic text-ink-soft">
          Loading…
        </p>
      </AppShell>
    );
  }

  const helperText = recorder.isRecording
    ? "Recording… release to stop"
    : recorder.audioBlob
      ? "Tap send when you're ready"
      : "Hold to speak";

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
            onPointerDown={() => {
              if (!recorder.isRecording && !recorder.audioBlob) {
                void recorder.startRecording();
              }
            }}
            onPointerUp={() => {
              if (recorder.isRecording) recorder.stopRecording();
            }}
            onPointerLeave={() => {
              if (recorder.isRecording) recorder.stopRecording();
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
              <div className="space-y-2">
                <label
                  htmlFor="recipient-email"
                  className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft"
                >
                  Their email (optional)
                </label>
                <input
                  id="recipient-email"
                  type="email"
                  value={recipientEmail}
                  onChange={(event) => setRecipientEmail(event.target.value)}
                  placeholder="friend@example.com"
                  className="w-full rounded-xl border border-ink/[0.35] bg-cream px-4 py-3 font-inter text-sm text-ink placeholder:text-ink-soft/60 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
                />
                <p className="font-inter text-xs italic text-ink-soft">
                  Add an email to send a listen link. Works locally without
                  Vercel — Klaviyo sends only if{" "}
                  <code className="text-[10px]">KLAVIYO_PRIVATE_API_KEY</code>{" "}
                  is set.
                </p>
              </div>

              <PrimaryButton
                type="button"
                disabled={sendStatus === "uploading"}
                onClick={() => void handleSend()}
              >
                {sendStatus === "uploading"
                  ? "Sending…"
                  : `Send to ${friend.name}`}
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
