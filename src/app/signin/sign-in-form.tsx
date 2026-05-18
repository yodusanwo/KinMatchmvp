"use client";

import { useState } from "react";
import {
  Eyebrow,
  Headline,
  PrimaryButton,
  Subhead,
  TextLink,
} from "@/components/brand";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

type SignInFormProps = {
  nextPath?: string;
  initialError?: boolean;
};

export function SignInForm({
  nextPath = "/today",
  initialError = false,
}: SignInFormProps) {
  const authError = initialError;
  const finishingOnboarding = nextPath === "/onboarding/finish";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="space-y-4 px-5 py-10">
        <Eyebrow>Check your inbox</Eyebrow>
        <Headline>Link sent</Headline>
        <Subhead>
          We emailed a sign-in link to <span className="text-ink">{email}</span>.
          {finishingOnboarding
            ? " Click it to finish setup and open your Today view — no password needed."
            : " Click it to continue — no password needed."}
        </Subhead>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 font-inter text-sm text-terracotta underline underline-offset-2"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-5 py-10">
      <div className="space-y-2">
        <Eyebrow>Sign in</Eyebrow>
        <Headline>Welcome back</Headline>
        <Subhead>
          {finishingOnboarding
            ? "One last step: we&apos;ll email you a magic link to save your tribe and open Today."
            : "We'll email you a magic link. Calm, no password required."}
        </Subhead>
      </div>

      {authError && (
        <p className="font-inter text-sm italic text-terracotta-deep" role="alert">
          That link didn&apos;t work. Try again.
        </p>
      )}

      {message && status === "error" && (
        <p className="font-inter text-sm italic text-terracotta-deep" role="alert">
          {message}
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={cn(
            "w-full rounded-xl border border-ink/[0.35] bg-cream px-4 py-3.5 font-inter text-base text-ink",
            "placeholder:text-ink-soft/60 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
          )}
        />
      </div>

      <PrimaryButton type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Sending link…" : "Email me a sign-in link"}
      </PrimaryButton>

      <p className="text-center">
        <TextLink href="/">← Back to welcome</TextLink>
      </p>
    </form>
  );
}
