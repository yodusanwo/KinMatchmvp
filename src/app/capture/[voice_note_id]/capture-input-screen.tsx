"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandBar, Eyebrow, Headline, PrimaryButton, Subhead } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { MiniAvatar } from "@/components/onboarding/MiniAvatar";
import { RecordButton } from "@/components/voice-note/RecordButton";
import { formatDuration } from "@/components/voice-note/format-duration";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import type { CaptureVoiceNoteContext } from "@/lib/capture/context";

type CaptureInputScreenProps = {
  voiceNote: CaptureVoiceNoteContext;
  initialRecap?: string;
};

function daysSince(iso: string) {
  return Math.max(
    1,
    Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  );
}

export function CaptureInputScreen({
  voiceNote,
  initialRecap = "",
}: CaptureInputScreenProps) {
  const router = useRouter();
  const [recap, setRecap] = useState(initialRecap);
  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorder = useVoiceRecorder();
  const transcribedBlobRef = useRef<Blob | null>(null);
  const sentDaysAgo = daysSince(voiceNote.created_at);

  useEffect(() => {
    async function transcribe() {
      if (!recorder.audioBlob || transcribedBlobRef.current === recorder.audioBlob) {
        return;
      }
      transcribedBlobRef.current = recorder.audioBlob;
      setTranscribing(true);
      setError(null);

      const formData = new FormData();
      formData.append("audio", recorder.audioBlob, "capture-recap");
      formData.append(
        "mime_type",
        recorder.recordedMimeType || recorder.audioBlob.type || "audio/webm"
      );

      const response = await fetch(`/api/capture/${voiceNote.id}/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(
          (data as { error?: string }).error ??
            "Could not transcribe that recording. You can type it instead."
        );
        setTranscribing(false);
        return;
      }

      const data = (await response.json()) as { text?: string };
      if (data.text?.trim()) {
        setRecap((current) =>
          [current.trim(), data.text?.trim()].filter(Boolean).join("\n\n")
        );
      }
      recorder.reset();
      setTranscribing(false);
    }

    void transcribe();
  }, [recorder, voiceNote.id]);

  async function extract() {
    if (recap.trim().length < 2) return;
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/capture/${voiceNote.id}/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_recap: recap }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setSaving(false);
      setError((data as { error?: string }).error ?? "Could not find memories.");
      return;
    }

    router.push(`/capture/${voiceNote.id}/review`);
  }

  async function skip() {
    await fetch(`/api/capture/${voiceNote.id}/skip`, { method: "POST" });
    router.push("/today");
  }

  return (
    <AppShell>
      <BrandBar />
      <div className="flex min-h-screen flex-col px-5 pb-10 pt-4">
        <Link
          href="/today"
          className="font-inter text-sm text-terracotta underline underline-offset-2"
        >
          ← Back
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <MiniAvatar
            name={voiceNote.friend_name}
            colorHex={voiceNote.friend_avatar_color_hex}
            initials={voiceNote.friend_avatar_initials}
            size="md"
          />
          <div>
            <p className="font-sans text-sm font-medium text-ink">
              {voiceNote.friend_name}
            </p>
            <p className="font-inter text-xs italic text-ink-soft">
              voice note sent {sentDaysAgo === 1 ? "yesterday" : `${sentDaysAgo} days ago`}
            </p>
          </div>
        </div>

        {voiceNote.original_question && (
          <section className="mt-6 rounded-2xl border border-ink/[0.12] bg-cream-deep/60 p-4">
            <Eyebrow>you asked</Eyebrow>
            <p className="mt-2 font-inter text-sm italic leading-relaxed text-ink">
              “{voiceNote.original_question}”
            </p>
          </section>
        )}

        <div className="mt-8">
          <Headline>What did {voiceNote.friend_name} share?</Headline>
          <Subhead className="mt-2">
            Type or voice-note what you learned. KinMatch will pull out the
            details worth saving.
          </Subhead>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-ink/[0.18] bg-cream-deep/40 p-4 text-center">
          <RecordButton
            isRecording={recorder.isRecording}
            disabled={saving || transcribing}
            onPress={() => {
              if (recorder.isRecording) {
                recorder.stopRecording();
                return;
              }
              void recorder.startRecording();
            }}
          />
          <p className="mt-2 font-inter text-xs italic text-ink-soft">
            {transcribing
              ? "transcribing your recap…"
              : recorder.isRecording
                ? `recording ${formatDuration(recorder.durationSeconds)}`
                : "tap to voice-note · or type below"}
          </p>
          {recorder.error && (
            <p className="mt-2 font-inter text-xs italic text-terracotta-deep">
              {recorder.error}
            </p>
          )}
        </div>

        <textarea
          value={recap}
          onChange={(event) => setRecap(event.target.value)}
          placeholder={`What did ${voiceNote.friend_name} say?`}
          className="mt-4 min-h-[180px] w-full resize-none rounded-2xl border border-ink/[0.12] bg-cream px-4 py-4 font-inter text-base italic leading-relaxed text-ink placeholder:text-ink-soft/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
        />

        {error && (
          <p className="mt-3 font-inter text-sm italic text-terracotta-deep">
            {error}
          </p>
        )}

        <div className="mt-auto space-y-4 pt-8">
          <PrimaryButton
            type="button"
            disabled={saving || recap.trim().length < 2}
            onClick={() => void extract()}
          >
            {saving ? "Finding details…" : "Find what's worth remembering →"}
          </PrimaryButton>
          <button
            type="button"
            onClick={() => void skip()}
            className="block w-full text-center font-inter text-sm text-ink-soft underline underline-offset-2"
          >
            skip, they haven&apos;t responded yet
          </button>
        </div>
      </div>
    </AppShell>
  );
}
