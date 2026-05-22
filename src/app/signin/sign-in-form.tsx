"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Eyebrow,
  Headline,
  PrimaryButton,
  Subhead,
  TextLink,
} from "@/components/brand";
import { createClient } from "@/lib/supabase/client";
import { getAuthRedirectOrigin } from "@/lib/auth/native-redirect";
import { cn } from "@/lib/cn";

type SignInFormProps = {
  authOrigin: string;
  nextPath?: string;
  initialError?: boolean;
};

function isNewUserFlow(nextPath: string): boolean {
  return (
    nextPath === "/onboarding" ||
    (nextPath.startsWith("/onboarding/") && nextPath !== "/onboarding/finish")
  );
}

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many sign-in emails sent recently. Wait about an hour, or set up custom SMTP in Supabase for higher limits.";
  }
  if (lower.includes("redirect") || lower.includes("url")) {
    return "Sign-in link misconfigured. Check Supabase redirect URLs match your Vercel site.";
  }
  return message;
}

export function SignInForm({
  authOrigin,
  nextPath = "/today",
  initialError = false,
}: SignInFormProps) {
  const router = useRouter();
  const authError = initialError;
  const finishingOnboarding = nextPath === "/onboarding/finish";
  const gettingStarted = isNewUserFlow(nextPath);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  const devBypassEnabled =
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

  async function handleDevBypass() {
    const trimmed = email.trim();
    if (!trimmed) {
      setMessage("Enter your email above first.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch("/api/dev/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          next: nextPath,
          origin: window.location.origin,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        next?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setMessage(
          data.error === "Not available"
            ? "Dev bypass is off on the server. Set NEXT_PUBLIC_DEV_AUTH_BYPASS=true in Vercel and redeploy."
            : (data.error ?? "Dev sign-in failed")
        );
        return;
      }
      router.push(data.next ?? nextPath);
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Dev sign-in failed");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    const supabase = createClient();
    const redirectOrigin = getAuthRedirectOrigin(authOrigin);
    const redirectTo = `${redirectOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus("error");
      setMessage(friendlyAuthError(error.message));
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
            : gettingStarted
              ? " Click it to begin your reflection — no password needed."
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
        <Eyebrow>{gettingStarted ? "Get started" : "Sign in"}</Eyebrow>
        <Headline>{gettingStarted ? "Create your account" : "Welcome back"}</Headline>
        <Subhead>
          {finishingOnboarding
            ? "One last step: we'll email you a magic link to save your tribe and open Today."
            : gettingStarted
              ? "We'll email you a magic link to get you started."
              : "We'll email you a magic link, no password required."}
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

      {devBypassEnabled && (
        <button
          type="button"
          onClick={() => void handleDevBypass()}
          disabled={status === "loading"}
          className="w-full rounded-xl border border-dashed border-ink/25 py-3 font-inter text-sm text-ink-soft hover:border-terracotta/40 hover:text-ink"
        >
          Continue without email (dev only)
        </button>
      )}

      <p className="text-center">
        <TextLink href="/">← Back to welcome</TextLink>
      </p>
    </form>
  );
}
