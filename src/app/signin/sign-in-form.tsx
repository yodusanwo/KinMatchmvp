"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
    return "Sign-in link misconfigured. Check Supabase redirect URLs match your production domain.";
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

  useEffect(() => {
    if (status !== "sent") return;

    const supabase = createClient();
    let cancelled = false;

    async function redirectIfSignedIn() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && !cancelled) {
        router.push(nextPath);
        router.refresh();
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session && !cancelled) {
        router.push(nextPath);
        router.refresh();
      }
    });

    void redirectIfSignedIn();
    const interval = window.setInterval(() => void redirectIfSignedIn(), 2000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearInterval(interval);
    };
  }, [status, nextPath, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    const supabase = createClient();
    const redirectTo = `${authOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
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
            ? " Click it to finish setup, this page will open when you do."
            : gettingStarted
              ? " Click it to begin, this page will open when you do."
              : " Click it to continue, this page will open when you do."}
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
        <label htmlFor="email" className="font-sans text-[15px] font-medium uppercase tracking-[0.12em] text-ink-soft">
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
