"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Eyebrow,
  Headline,
  PrimaryButton,
  SecondaryButton,
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

  async function handleGoogleSignIn() {
    setStatus("loading");
    setMessage(null);

    const supabase = createClient();
    const redirectTo = `${authOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setStatus("error");
      setMessage(friendlyAuthError(error.message));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, onboarding_completed_at")
      .eq("email", normalizedEmail)
      .maybeSingle();

    // Show helpful message if user is in wrong flow
    if (gettingStarted && existingUser?.onboarding_completed_at) {
      setMessage(
        "You already have an account. Sending your sign-in link..."
      );
    } else if (!gettingStarted && !existingUser) {
      setMessage(
        "No account found with that email. Creating your account and sending link..."
      );
    }

    const redirectTo = `${authOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
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

      {message && status === "loading" && (
        <p className="font-inter text-sm italic text-ink-soft" role="status">
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

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-ink/[0.2]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-cream px-4 font-inter text-ink-soft">or</span>
        </div>
      </div>

      <SecondaryButton
        type="button"
        onClick={handleGoogleSignIn}
        disabled={status === "loading"}
        className="flex items-center justify-center gap-2"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </SecondaryButton>

      <p className="text-center">
        <TextLink href="/">← Back to welcome</TextLink>
      </p>
    </form>
  );
}
