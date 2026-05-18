"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Eyebrow, Headline, Subhead } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BrandBar } from "@/components/brand";
import { useOnboarding } from "@/contexts/onboarding-context";
import { createClient } from "@/lib/supabase/client";
import type { CompleteOnboardingPayload } from "@/lib/onboarding/api-types";
import type { OnboardingState } from "@/lib/onboarding/types";

const STORAGE_KEY = "kinmatch-onboarding";

function loadOnboardingFromStorage(): Partial<OnboardingState> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingState;
  } catch {
    return null;
  }
}

export function FinishScreen() {
  const router = useRouter();
  const { q1People, q2People, q3Barriers, watchers, resetOnboarding, hydrated } =
    useOnboarding();
  const [status, setStatus] = useState<"checking" | "saving" | "done" | "error">(
    "checking"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!hydrated || hasRun.current) return;

    const supabase = createClient();

    async function complete() {
      hasRun.current = true;

      // Wait for session cookies after magic-link redirect
      let session = (await supabase.auth.getSession()).data.session;
      for (let attempt = 0; !session && attempt < 8; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        session = (await supabase.auth.getSession()).data.session;
      }

      if (!session?.user) {
        hasRun.current = false;
        router.replace("/signin?next=/onboarding/finish");
        return;
      }

      const stored = loadOnboardingFromStorage();
      const people = q1People.length > 0 ? q1People : (stored?.q1People ?? []);
      const peopleQ2 = q2People.length > 0 ? q2People : (stored?.q2People ?? []);
      const barriers =
        q3Barriers.length > 0 ? q3Barriers : (stored?.q3Barriers ?? []);
      const watcherIds =
        watchers.length > 0 ? watchers : (stored?.watchers ?? []);

      if (people.length === 0) {
        hasRun.current = false;
        router.replace("/onboarding/q1");
        return;
      }

      setStatus("saving");

      const payload: CompleteOnboardingPayload = {
        q1People: people,
        q2People: peopleQ2,
        q3Barriers: barriers,
        watchers: watcherIds,
      };

      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        hasRun.current = false;
        setErrorMessage(
          (data as { error?: string }).error ?? "Could not save your tribe."
        );
        setStatus("error");
        return;
      }

      resetOnboarding();
      sessionStorage.removeItem(STORAGE_KEY);
      setStatus("done");
      router.replace("/today");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session && !hasRun.current) {
        complete();
      }
    });

    complete();

    return () => subscription.unsubscribe();
  }, [hydrated, q1People, q2People, q3Barriers, watchers, resetOnboarding, router]);

  return (
    <AppShell>
      <BrandBar />
      <div className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center px-5 py-12 text-center">
        {status === "error" ? (
          <div className="space-y-4">
            <Eyebrow>Something went wrong</Eyebrow>
            <Headline>Couldn&apos;t save your tribe</Headline>
            <Subhead>{errorMessage}</Subhead>
            <button
              type="button"
              onClick={() => {
                hasRun.current = false;
                window.location.reload();
              }}
              className="font-inter text-sm text-terracotta underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Eyebrow>Almost there</Eyebrow>
            <Headline>Saving your tribe…</Headline>
            <Subhead>Just a moment while we put everyone in place.</Subhead>
          </div>
        )}
      </div>
    </AppShell>
  );
}
