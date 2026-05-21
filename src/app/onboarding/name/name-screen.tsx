"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandBar, Eyebrow, Headline } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { ContinueButton } from "@/components/onboarding/ContinueButton";
import { useOnboarding } from "@/contexts/onboarding-context";

type NameScreenProps = {
  initialName: string;
  placeholderName: string;
};

export function NameScreen({ initialName, placeholderName }: NameScreenProps) {
  const router = useRouter();
  const { setUserName } = useOnboarding();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedName = name.trim();
  const canContinue = trimmedName.length >= 2 && !saving;

  async function handleContinue() {
    if (!canContinue) {
      setError("Use at least 2 characters.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding/name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        name?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not save your name.");
      }

      setUserName(data.name ?? trimmedName);
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your name.");
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <BrandBar />
      <div className="flex min-h-[calc(100vh-65px)] flex-col px-5 pb-8 pt-7">
        <div className="space-y-5">
          <div className="space-y-3">
            <Eyebrow>first things first</Eyebrow>
            <Headline className="max-w-[320px] text-[34px] leading-[1.08]">
              What should we call you?
            </Headline>
            <p className="max-w-[330px] font-inter text-[13px] italic leading-[1.55] text-[rgba(31,26,20,0.65)]">
              Your name, as your people would say it. Just a first name is fine.
            </p>
          </div>

          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            placeholder={placeholderName || "Your first name"}
            className="w-full rounded-xl border border-[rgba(31,26,20,0.15)] bg-white px-4 py-3.5 font-inter text-[15px] text-ink placeholder:text-ink-soft/55 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
            aria-label="Your first name"
            autoComplete="given-name"
            autoFocus
          />

          {error && (
            <p className="font-inter text-sm italic text-terracotta-deep" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="mt-auto">
          <ContinueButton
            variant="terracotta"
            disabled={!canContinue}
            onClick={() => void handleContinue()}
          >
            {saving ? "Saving…" : "Continue →"}
          </ContinueButton>
        </div>
      </div>
    </AppShell>
  );
}
