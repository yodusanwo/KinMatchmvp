"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eyebrow, Headline, TextLink } from "@/components/brand";
import { ContinueButton } from "@/components/onboarding/ContinueButton";
import { NumberedSteps } from "@/components/onboarding/NumberedSteps";
import { AppShell } from "@/components/layout/AppShell";
import { BrandBar } from "@/components/brand";
import { useOnboarding } from "@/contexts/onboarding-context";
import type { CompleteOnboardingPayload } from "@/lib/onboarding/api-types";
import {
  hasGetUserMedia,
  iosSafariUnlockSteps,
  isIOS,
  requestMicAccess,
} from "@/lib/audio/mic-permission";

type MicStatusLocal =
  | "idle"
  | "requesting"
  | "ready"
  | "blocked"
  | "unsupported";

const REFLECTION_COPY_CLASS =
  "font-inter text-sm italic leading-[1.5] text-[rgba(31,26,20,0.65)]";

const STORAGE_KEY = "kinmatch-onboarding";

const HOW_IT_WORKS_STEPS = [
  {
    number: 1,
    title: "Thoughtful emails, about 3 a week.",
    description:
      "Each one is a small nudge — a name from your inner circle or village and a reason to reach out.",
  },
  {
    number: 2,
    title: "Open it when it lands.",
    description:
      "If KinMatch is reaching out, someone in your circle could use you today.",
  },
  {
    number: 3,
    title: "Send a voice note, text, or quick check-in.",
    description:
      "60 seconds is enough. KinMatch handles the rhythm and remembers the rest.",
  },
];

export function EmailPrefsScreen() {
  const router = useRouter();
  const {
    q1People,
    q2People,
    circleAssignments,
    q3Barriers,
    watchers,
    resetOnboarding,
    hydrated,
  } = useOnboarding();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micStatus, setMicStatus] = useState<MicStatusLocal>("idle");
  const [micMessage, setMicMessage] = useState<string | null>(null);
  const saveInFlight = useRef(false);

  async function requestMicrophone() {
    console.log("[email-prefs] requestMicrophone tapped");
    setError(null);
    setMicMessage(null);

    if (!hasGetUserMedia()) {
      setMicStatus("unsupported");
      setMicMessage(
        "This browser can't set up voice notes here. You can still continue.",
      );
      return false;
    }

    setMicStatus("requesting");

    const result = await requestMicAccess();
    if (result.ok) {
      result.stream.getTracks().forEach((track) => track.stop());
      setMicStatus("ready");
      setMicMessage("Voice notes are ready.");
      return true;
    }

    setMicStatus(
      result.error.kind === "unsupported" ? "unsupported" : "blocked",
    );
    setMicMessage(result.error.message);
    return false;
  }

  async function handleSave() {
    if (!hydrated || saving || saveInFlight.current) return;

    if (q1People.length === 0) {
      router.push("/onboarding/q1");
      return;
    }

    saveInFlight.current = true;
    setSaving(true);
    setError(null);

    const payload: CompleteOnboardingPayload = {
      q1People,
      q2People,
      circleAssignments,
      q3Barriers,
      watchers,
    };

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        alreadyCompleted?: boolean;
      };

      if (!res.ok) {
        setError(data.error ?? "Could not save your people.");
        saveInFlight.current = false;
        setSaving(false);
        return;
      }

      resetOnboarding();
      sessionStorage.removeItem(STORAGE_KEY);
      router.replace("/onboarding/rituals");
    } catch {
      setError(
        "Could not save your people. Check your connection and try again.",
      );
      saveInFlight.current = false;
      setSaving(false);
    }
  }

  async function handleSetupVoiceNotes() {
    if (saving || micStatus === "requesting") return;

    const allowed = await requestMicrophone();
    if (allowed) {
      await handleSave();
    }
  }

  const showRecoverySteps = micStatus === "blocked";

  return (
    <AppShell>
      <BrandBar />
      <div className="flex min-h-[calc(100vh-65px)] flex-col justify-between px-5 py-8">
        <div className="space-y-8">
          <div className="space-y-2">
            <Eyebrow>Here&apos;s how it works</Eyebrow>
            <Headline>Here&apos;s where we begin.</Headline>
            <p className={REFLECTION_COPY_CLASS}>
              KinMatch helps you stay close to the people in your inner circle
              and village without pretending every relationship needs the same
              level of attention.
            </p>
          </div>

          <NumberedSteps steps={HOW_IT_WORKS_STEPS} terracottaOnly />

          <section className="space-y-2">
            <Eyebrow>What happens next</Eyebrow>
            <p className={REFLECTION_COPY_CLASS}>
              We&apos;ll save your people and take you to your dashboard, where
              you&apos;ll see who to reach out to today.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-ink/[0.12] bg-cream-deep/45 p-4">
            <Eyebrow>Voice notes</Eyebrow>
            <p className="font-sans text-base font-medium text-ink">
              Set up voice notes before the first one.
            </p>
            <p className={REFLECTION_COPY_CLASS}>
              Your phone will ask before anything is recorded. We&apos;ll only
              use the microphone when you start a note.
            </p>

            {micMessage && micStatus === "ready" && (
              <p
                className="font-inter text-sm italic text-ink-soft"
                role="status"
              >
                {micMessage}
              </p>
            )}

            {micMessage && micStatus !== "ready" && !showRecoverySteps && (
              <p
                className="font-inter text-sm italic text-terracotta-deep"
                role="alert"
              >
                {micMessage}
              </p>
            )}

            {showRecoverySteps && (
              <div className="space-y-3 rounded-xl bg-cream p-4">
                <p className="font-sans text-sm font-medium text-ink">
                  {isIOS()
                    ? "Safari has the microphone blocked."
                    : "Your browser has the microphone blocked."}
                </p>
                {isIOS() ? (
                  <>
                    <p className="font-inter text-xs italic text-ink-soft">
                      Fix it right inside Safari:
                    </p>
                    <ol className="space-y-2 font-inter text-sm leading-relaxed text-ink">
                      {iosSafariUnlockSteps().map((step, index) => (
                        <li key={step} className="flex gap-3">
                          <span className="font-mono text-xs text-terracotta">
                            {index + 1}.
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <p className="font-inter text-sm leading-relaxed text-ink">
                    Open your browser&apos;s site settings, allow the microphone
                    for this site, then reload this page.
                  </p>
                )}
                <p className="font-inter text-xs italic text-ink-soft">
                  Or skip this step — you can text your people directly and
                  KinMatch will still keep the rhythm.
                </p>
              </div>
            )}
          </section>

          {error && (
            <p
              className="font-inter text-sm italic text-terracotta-deep"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <div className="mt-8 space-y-4 pb-4">
          <ContinueButton
            variant="terracotta"
            disabled={saving || !hydrated || micStatus === "requesting"}
            onClick={() => void handleSetupVoiceNotes()}
          >
            {saving
              ? "Saving…"
              : micStatus === "requesting"
                ? "Asking…"
                : showRecoverySteps
                  ? "Try again →"
                  : "Set up voice notes →"}
          </ContinueButton>
          <p className="text-center">
            <button
              type="button"
              disabled={saving || !hydrated}
              onClick={() => void handleSave()}
              className="font-inter text-sm text-terracotta underline decoration-terracotta/60 underline-offset-2 disabled:text-ink-soft disabled:decoration-ink-soft/40"
            >
              Set up later
            </button>
          </p>
          <p className="text-center">
            {saving ? (
              <span className="font-inter text-sm text-ink-soft">← Back</span>
            ) : (
              <TextLink href="/onboarding/held">← Back</TextLink>
            )}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
